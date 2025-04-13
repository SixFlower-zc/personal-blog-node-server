const rateLimit = require('express-rate-limit')

/**
 * 速率限制中间件
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟窗口
  max: 20, // 每个IP限制20次请求
  message: '请求过于频繁，请15分钟后再试', // 超过限制时的提示信息
})

module.exports = limiter
