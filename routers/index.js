const adminLogRouter = require('./modules/adminLogRouter')
const adminRouter = require('./modules/adminRouter')
const albumRouter = require('./modules/albumRouter')
const captcha = require('./modules/captchaRouter')
const docRouter = require('./modules/docRouter')
const imageRouter = require('./modules/imageRouter')
const projectRouter = require('./modules/projectRouter')
const uploadRouter = require('./modules//uploadRouter')
const userRouter = require('./modules/userRouter')
const captchaRouter = require('./modules/captchaRouter')

module.exports = {
  // 管理员日志路由
  adminLogRouter,
  // 管理员路由
  adminRouter,
  // 相册路由
  albumRouter,
  // 验证码路由
  captcha,
  // 文档路由
  docRouter,
  // 图片压缩路由
  imageRouter,
  // 项目路由
  projectRouter,
  // 上传文件路由
  uploadRouter,
  // 用户路由
  userRouter,
  // 验证码路由
  captchaRouter,
}
