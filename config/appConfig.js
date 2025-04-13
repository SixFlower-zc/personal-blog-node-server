const dbConfig = {
  port: process.env.PORT || 3000, // 端口号
  base_url: process.env.BASE_URL || 'http://localhost:3000', // 网站域名
  maxImageSize: 10 * 1024 * 1024, // 最大允许上传文件大小 10MB
  maxVideoSize: 50 * 1024 * 1024, // 最大允许上传文件大小 50MB
  maxWidth: 4000, // 最大允许宽度
}

module.exports = dbConfig
