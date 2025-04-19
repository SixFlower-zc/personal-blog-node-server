const rateLimit = require('express-rate-limit')

/**
 * 图片上传速率限制中间件
 */
const uploadlimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10分钟窗口
  max: 100, // 每个IP限制100次请求
  message: '请求过于频繁，请15分钟后再试', // 超过限制时的提示信息
})

/**
 * 验证码请求速率限制中间件
 */
const captchaLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟窗口
  max: 5, // 每分钟限制5次请求
  message: '请求过于频繁，请1分钟后再试', // 超过限制时的提示信息
})

module.exports = { uploadlimiter, captchaLimiter }
