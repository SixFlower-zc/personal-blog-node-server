const corsMiddleware = require('./modules/corsMiddleware')
const apiKeyAuth = require('./modules/apiKeyAuth')
const initCronJobs = require('./modules/cron')
const rateLimiter = require('./modules/rateLimiter')
const { jsonParser, urlencodedParser } = require('./modules/bodyParserMiddlewares')
const helmetMiddlewares = require('./modules/helmetMiddlewares')
const requestLoggerMiddleware = require('./modules/requestLoggerMiddleware')

module.exports = {
  // 密钥验证中间件
  apiKeyAuth,
  // 定时任务中间件
  initCronJobs,
  // 跨域中间件
  corsMiddleware,
  // 限流中间件
  ...rateLimiter,
  // body解析中间件
  jsonParser,
  urlencodedParser,
  // 安全防护中间件
  helmetMiddlewares,
  // 日志记录中间件
  requestLoggerMiddleware,
}
