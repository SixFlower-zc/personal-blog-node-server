const express = require('express')

/**
 * API密钥验证中间件
 * @param {express.Request} req 请求对象
 * @param {express.Response} res 响应对象
 * @param {express.NextFunction} next 中间件执行函数
 */
const apiKeyAuth = (req, res, next) => {
  // 读取环境变量中的API密钥, 并转换为Set, 防止重复
  const validKeys = new Set((process.env.SECRET_KEY || '').split(','))

  // 从请求头中读取客户端提供的API密钥
  const clientKey = req.headers['x-api-key']

  // 如果未配置API密钥，则不进行验证
  if (validKeys.size === 0) {
    console.warn('警告：未配置API密钥，禁用安全验证')
    return next()
  }

  // 如果客户端未提供API密钥，则返回401错误
  if (!clientKey) {
    return res.status(401).json({ error: '缺少API密钥' })
  }

  // 如果客户端提供的API密钥不在配置的API密钥中，则返回401错误
  if (validKeys.has(clientKey)) {
    next()
  } else {
    res.status(401).json({ error: '无效的API密钥' })
  }
}

module.exports = apiKeyAuth
