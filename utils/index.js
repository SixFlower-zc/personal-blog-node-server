const db = require('./modules/db')
const { encryption, verification } = require('./modules/JwtCode')
const { hashPassword, verifyPassword } = require('./modules/passwordUtils')
const randomFileName = require('./modules/randomFileName')
const formatResponse = require('./modules/responseFormatter')
const getBaseUrl = require('./modules/getBaseUrl')
const sendEmail = require('./modules/email')
const validateCaptcha = require('./modules/validateCaptcha')
const generateNickname = require('./modules/generateNickname')

module.exports = {
  // 数据库连接
  db,
  // JWT加密解密
  encryption,
  verification,
  // 密码加密解密
  hashPassword,
  verifyPassword,
  // 生成随机文件名
  randomFileName,
  // 响应格式化
  formatResponse,
  // 获取请求的基础路径
  getBaseUrl,
  // 发送邮件工具
  sendEmail,
  // 验证码验证
  validateCaptcha,
  // 生成昵称
  generateNickname,
}
