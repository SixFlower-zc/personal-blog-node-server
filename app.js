const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')

// 加载环境变量
require('dotenv').config()

// 加载工具函数
const { db, formatResponse } = require('./utils')

// 加载中间件
const {
  corsMiddleware,
  helmetMiddlewares,
  requestLoggerMiddleware,
  apiKeyAuth,
  uploadlimiter,
} = require('./middlewares')

// 引入配置文件
const { port, base_url } = require('./config/appConfig')

// 引入路由
const { imageRouter, uploadRouter, userRouter, captchaRouter } = require('./routers')

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

    // cooke-parser中间件
    app.use(cookieParser())

    // 路由挂载
    app.use('/images', imageRouter)
    app.use('/upload', uploadRouter)
    app.use('/user', userRouter)
    app.use('/captcha', captchaRouter)

    // 404处理
    app.use((req, res, next) => {
      res.status(404).send('<h1>你访问的页面不存在</h1>')
      // 重定向到404页面
      // res.redirect('/html/404.html')
    })

    // 错误处理中间件
    app.use((err, req, res, next) => {
      console.error('全局错误:', err)
      res.status(500).send(formatResponse(0, err.message, err))
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
