const cors = require('cors')

/**
 * 跨域配置中间件
 */
const corsOptions = {
  origin: '*', // 允许所有域名访问，生产环境建议配置具体的域名
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'], // 允许的请求方法
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'], // 允许的请求头
  exposedHeaders: ['Content-Range', 'X-Content-Range'], // 允许的响应头
  credentials: true, // 允许携带cookie
  maxAge: 86400, // 预检请求缓存时间
}

module.exports = cors(corsOptions)
