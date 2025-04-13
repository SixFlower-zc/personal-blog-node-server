const fs = require('fs')
const path = require('path')

// 请求日志中间件
const requestLoggerMiddleware = (req, res, next) => {
  // 1. 提取请求的基本信息
  const method = req.method // 请求方法（如 GET、POST 等）
  const url = req.url // 请求路径
  const ip = req.ip || req.connection.remoteAddress // 客户端 IP 地址
  const userAgent = req.headers['user-agent'] // 用户代理信息
  const timestamp = new Date().toISOString() // 当前时间

  // 2. 格式化日志内容
  const logMessage = `${timestamp} ${method} ${url} IP: ${ip} User-Agent: ${userAgent}`

  // 3. 提取日志文件路径
  const logDirectory = path.join(__dirname, '../..', 'public/logs')
  const logFileName = formatLogFileName(ip) // 将 IP 地址转换为合法的文件名
  const logFilePath = path.join(logDirectory, logFileName)

  // 4. 确保日志目录存在
  ensureDirectoryExistence(logFilePath)

  // 5. 将日志写入文件并打印到控制台
  fs.appendFileSync(logFilePath, logMessage + '\n') // 写入文件
  console.log(logMessage) // 同时打印到控制台

  // 6. 继续执行下一个中间件或路由
  next()
}

// 辅助函数：确保目录存在
function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath)
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true })
  }
}

// 辅助函数：格式化日志文件名
function formatLogFileName(ip) {
  // 将 IP 地址中的非法字符替换为合法字符
  return ip.replace(/:/g, '_') + '.txt' // 例如，将 ::1 替换为 _1.txt
}

// 导出中间件
module.exports = requestLoggerMiddleware
