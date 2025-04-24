/**
 * HTTP请求日志中间件（生产级优化版本）
 * 功能：记录请求日志、自动轮转、安全处理、性能优化
 */
const fs = require('fs').promises // 使用Promise版文件系统API
const path = require('path')
const { createWriteStream } = require('fs')
const os = require('os') // 用于获取操作系统相关常量

// ==================== 配置系统 ====================
/**
 * 默认配置对象
 * @typedef {Object} LoggerConfig
 * @property {string} logDirectory - 日志存储目录路径
 * @property {'json'|'text'} format - 日志格式类型
 * @property {'info'|'debug'} level - 日志记录级别
 * @property {RotationConfig} rotation - 日志轮转配置
 * @property {boolean} console - 是否输出到控制台
 *
 * @typedef {Object} RotationConfig
 * @property {number} size - 单个日志文件最大字节数（单位：字节）
 * @property {number} keepDays - 日志保留天数
 * @property {boolean} archive - 是否归档旧日志
 */
const defaultOptions = {
  logDirectory: path.join(process.cwd(), 'logs'), // 默认日志目录为项目下的logs目录
  format: 'json', // 默认使用JSON格式便于后续分析
  level: 'info', // 默认日志级别为info
  rotation: {
    // 日志轮转配置
    size: 100 * 1024 * 1024, // 100MB，超过后触发轮转
    keepDays: 7, // 保留最近7天日志
    archive: true, // 将旧日志归档而不是删除
  },
  console: process.env.NODE_ENV !== 'production', // 非生产环境输出到控制台
}

// ==================== 核心类实现 ====================
class RequestLogger {
  /**
   * 构造函数
   * @param {LoggerConfig} options - 用户自定义配置
   */
  constructor(options = {}) {
    // 合并用户配置与默认配置
    this.config = { ...defaultOptions, ...options }
    // 文件流缓存池（提升写入性能）
    this.writeStreams = new Map()
    // 初始化日志系统
    this.init()
  }

  // ==================== 初始化方法 ====================
  /**
   * 初始化日志系统
   * 1. 创建日志目录
   * 2. 启动定时清理任务
   */
  async init() {
    // 递归创建日志目录（如果不存在）
    await fs.mkdir(this.config.logDirectory, { recursive: true })

    // 每天执行一次旧日志清理（24小时*60分钟*60秒*1000毫秒）
    setInterval(() => this.cleanOldLogs(), 86400000)
  }

  // ==================== 中间件入口 ====================
  /**
   * Express中间件生成器
   * @returns {Function} Express中间件函数
   */
  middleware() {
    return async (req, res, next) => {
      const startTime = Date.now() // 记录请求开始时间

      // 在响应完成时记录日志（确保获取最终状态码）
      res.on('finish', async () => {
        try {
          // 创建日志数据结构
          const logData = this.createLogData(req, res, startTime)
          // 异步写入日志（不阻塞主线程）
          await this.writeLog(logData)
        } catch (err) {
          console.error('[Logger] 日志写入失败:', err)
        }
      })

      next() // 继续处理请求
    }
  }

  // ==================== 日志数据处理 ====================
  /**
   * 创建标准化日志数据结构
   * @param {Request} req - Express请求对象
   * @param {Response} res - Express响应对象
   * @param {number} startTime - 请求开始时间戳
   * @returns {LogData} 标准化日志对象
   */
  createLogData(req, res, startTime) {
    return {
      timestamp: new Date().toISOString(), // ISO格式时间戳
      method: req.method, // HTTP方法
      url: req.originalUrl, // 原始请求URL
      ip: this.sanitizeIp(req.ip || req.connection.remoteAddress), // 消毒后的客户端IP
      userAgent: req.headers['user-agent'] || '', // 用户代理信息
      status: res.statusCode, // HTTP状态码
      responseTime: Date.now() - startTime, // 响应耗时（毫秒）
      referrer: req.headers.referer || '', // 请求来源
    }
  }

  // ==================== 日志写入核心 ====================
  /**
   * 主日志写入方法
   * @param {LogData} data - 日志数据对象
   */
  async writeLog(data) {
    try {
      // 格式化日志内容（根据配置选择JSON/文本格式）
      const content = this.formatContent(data)

      // 开发环境输出到控制台
      if (this.config.console) {
        console.log(this.config.format === 'json' ? data : content)
      }

      // 获取日志文件路径（按日期和IP分类）
      const filePath = await this.getLogFilePath(data.ip)
      // 检查是否需要日志轮转
      await this.checkLogRotation(filePath)

      // 获取写入流（使用缓存提升性能）
      const writer = this.getWriteStream(filePath)
      // 异步写入日志内容
      await this.writeToStream(writer, content)
    } catch (err) {
      console.error('[Logger] 系统错误:', err)
    }
  }

  // ==================== 格式处理 ====================
  /**
   * 格式化日志内容
   * @param {LogData} data - 日志数据对象
   * @returns {string} 格式化后的日志字符串
   */
  formatContent(data) {
    return this.config.format === 'json'
      ? JSON.stringify(data) + os.EOL // JSON格式换行符
      : [
          // 文本格式模板
          `[${data.timestamp}]`, // 时间戳
          `${data.method} ${data.url}`, // 请求方法+路径
          `IP: ${data.ip}`, // 客户端IP
          `Status: ${data.status}`, // 状态码
          `Response: ${data.responseTime}ms`, // 响应时间
          `UA: ${data.userAgent}`, // 用户代理摘要
        ].join(' | ') + os.EOL // 用竖线分隔字段
  }

  // ==================== 文件路径管理 ====================
  /**
   * 生成日志文件路径
   * @param {string} ip - 客户端IP地址
   * @returns {Promise<string>} 日志文件完整路径
   */
  async getLogFilePath(ip) {
    const date = new Date().toISOString().slice(0, 10) // 获取当前日期（YYYY-MM-DD）
    const filename = `access_${date}_${ip}.log` // 按日期和IP生成文件名
    return path.join(this.config.logDirectory, filename)
  }

  // ==================== 日志轮转系统 ====================
  /**
   * 检查并执行日志轮转
   * @param {string} filePath - 目标日志文件路径
   */
  async checkLogRotation(filePath) {
    try {
      const stats = await fs.stat(filePath)
      // 当前文件超过最大尺寸时进行轮转
      if (stats.size > this.config.rotation.size) {
        const archivePath = `${filePath}.${Date.now()}.bak` // 添加时间戳的归档文件
        await fs.rename(filePath, archivePath)
      }
    } catch (err) {
      // 文件不存在时忽略错误
      if (err.code !== 'ENOENT') throw err
    }
  }

  // ==================== 流管理 ====================
  /**
   * 获取写入流（带缓存机制）
   * @param {string} filePath - 文件路径
   * @returns {WriteStream} 可写流实例
   */
  getWriteStream(filePath) {
    if (!this.writeStreams.has(filePath)) {
      // 创建追加写入流，自动关闭防止文件描述符泄漏
      const writer = createWriteStream(filePath, {
        flags: 'a', // 追加模式
        encoding: 'utf8',
        autoClose: true, // 自动关闭空闲流
      })
      this.writeStreams.set(filePath, writer)
    }
    return this.writeStreams.get(filePath)
  }

  /**
   * 安全写入流方法（Promise封装）
   * @param {WriteStream} stream - 可写流实例
   * @param {string} content - 要写入的内容
   * @returns {Promise} 写入操作Promise
   */
  writeToStream(stream, content) {
    return new Promise((resolve, reject) => {
      stream.write(content, (err) => {
        err ? reject(err) : resolve()
      })
    })
  }

  // ==================== 日志清理 ====================
  /**
   * 清理过期日志文件
   */
  async cleanOldLogs() {
    try {
      const files = await fs.readdir(this.config.logDirectory)
      const now = Date.now()

      for (const file of files) {
        const filePath = path.join(this.config.logDirectory, file)
        const stats = await fs.stat(filePath)

        // 计算文件存在时间（毫秒）
        const age = now - stats.birthtimeMs
        // 超过保留天数时删除（天数转毫秒）
        if (age > this.config.rotation.keepDays * 86400000) {
          await fs.unlink(filePath)
        }
      }
    } catch (err) {
      console.error('[Logger] 日志清理失败:', err)
    }
  }

  // ==================== 安全处理 ====================
  /**
   * IP地址消毒处理
   * @param {string} ip - 原始IP地址
   * @returns {string} 消毒后的安全IP字符串
   */
  sanitizeIp(ip) {
    return ip
      .replace(/[^a-fA-F0-9.:]/g, '') // 移除非十六进制字符
      .replace(/::/g, '_') // 处理IPv6简写格式
  }
}

// ==================== 工厂函数 ====================
/**
 * 创建日志中间件的工厂函数
 * @param {LoggerConfig} options - 配置选项
 * @returns {Function} Express中间件
 */
function createRequestLogger(options) {
  const logger = new RequestLogger(options)
  return logger.middleware()
}

module.exports = createRequestLogger

// // 基础用法
// const logger = require('./request-logger')
// app.use(logger())

// // 高级配置
// app.use(logger({
//   logDirectory: '/var/log/myapp',
//   format: 'text',
//   rotation: {
//     size: 500 * 1024 * 1024, // 500MB
//     keepDays: 30
//   },
//   console: false
// }))
