const dbConfig = {
  useBodyUrl: false, // 是否从请求体中获取url
  port: process.env.PORT || 3000, // 端口号
  base_url: process.env.BASE_URL || 'http://localhost:3000', // 网站域名
  maxImageSize: 10 * 1024 * 1024, // 最大允许上传文件大小 10MB
  maxVideoSize: 50 * 1024 * 1024, // 最大允许上传文件大小 50MB
  allowImageWidth: [400, 800, 1600, 3200, 4000], // 允许的图片宽度，默认为最低宽度
  defaultQuality: 80, // 默认的图片质量
}

module.exports = dbConfig
