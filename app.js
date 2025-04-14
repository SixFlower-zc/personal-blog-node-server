const express = require('express')
const path = require('path')

// 加载工具函数
const { db } = require('./utils')

// 加载中间件
const {
  corsMiddleware,
  helmetMiddlewares,
  requestLoggerMiddleware,
  apiKeyAuth,
  rateLimiter,
} = require('./middlewares')

// 加载环境变量
require('dotenv').config()

// 引入配置文件
const { port, base_url } = require('./config/appConfig')

// 引入路由
const { imageRouter, uploadRouter } = require('./routers')

const app = express()

db(
  async () => {
    // 静态资源托管
    app.use('/', express.static(path.resolve(__dirname, 'public/assets')))

    // 跨域配置中间件
    app.use(corsMiddleware)

    // 应用安全中间件
    app.use(helmetMiddlewares)

    // 请求日志中间件
    app.use(requestLoggerMiddleware)

    // 错误处理中间件
    app.use((err, req, res, next) => {
      console.error('全局错误:', err)
      res.status(500).set().send('服务器内部错误！')
    })

    // 路由挂载
    app.use('/images', rateLimiter, imageRouter)
    app.use('/upload', rateLimiter, apiKeyAuth, uploadRouter)

    // 404处理
    app.use((req, res, next) => {
      res.status(404).send('<h1>你访问的页面不存在</h1>')
      // 重定向到404页面
      // res.redirect('/html/404.html')
    })

    // 启动服务
    app.listen(port, () => {
      console.log('数据库连接成功!!!', `服务已启动，请访问: ${base_url}`)
    })
  },
  (err) => {
    console.log('数据库连接失败!!!', err)
  }
)
