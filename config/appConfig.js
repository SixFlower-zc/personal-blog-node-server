const dbConfig = {
  useBodyUrl: false, // 是否从请求体中获取url
  port: process.env.PORT || 3000, // 端口号
  base_url: process.env.BASE_URL || 'http://localhost:3000', // 网站域名
  maxImageSize: 10 * 1024 * 1024, // 最大允许上传文件大小 10MB
  maxVideoSize: 50 * 1024 * 1024, // 最大允许上传文件大小 50MB
  allowImageExt: ['jpg', 'jpeg', 'png', 'gif', 'webp'], // 允许的图片格式
  allowVideoExt: ['mp4', 'avi', 'wmv', 'rmvb', 'flv'], // 允许的视频格式
  allowImageWidth: [400, 800, 1600, 3200], // 允许的图片宽度，第一个为默认宽度
  allowImageQuality: [80, 90, 100], // 允许的图片质量，第一个为默认质量
}

module.exports = dbConfig
