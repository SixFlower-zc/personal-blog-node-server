const helmet = require('helmet')

const helmetMiddlewares = helmet({
  // 防止跨站脚本攻击
  contentSecurityPolicy: false,
  // 防止跨站请求伪造
  frameguard: false,
  // 防止点击劫持
  xssFilter: false,
  // 防止缓存
  noCache: false,
  // 防止内容类型混乱
  contentTypeNosniff: false,
  // 防止点击劫持
  hsts: false,
  // 防止跨站请求伪造
  referrerPolicy: false,
  // 防止跨域资源共享
  crossOriginResourcePolicy: { policy: 'cross-origin' },
})

module.exports = helmetMiddlewares
