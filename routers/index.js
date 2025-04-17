const imageRouter = require('./modules/imageRouter')
const uploadRouter = require('./modules//uploadRouter')
const userRouter = require('./modules/userRouter')

module.exports = {
  // 图片压缩路由
  imageRouter,
  // 上传文件路由
  uploadRouter,
  // 用户路由
  userRouter,
}
