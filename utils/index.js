const db = require('./modules/db')
const { encryption, verification } = require('./modules/JwtCode')
const { hashPassword, verifyPassword } = require('./modules/passwordUtils')
const randomFileName = require('./modules/randomFileName')
const responseFormatter = require('./modules/responseFormatter')
const validationUtils = require('./modules/validationUtils')

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
  responseFormatter,
  // 参数校验
  validationUtils,
}
