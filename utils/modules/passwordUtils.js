const bcrypt = require('bcryptjs')

/**
 * 密码加密工具
 * @param {string} plainPassword - 明文密码
 * @param {number} [saltRounds=10] - 盐值生成强度（默认10）
 * @returns {Promise<string>} 加密后的哈希值
 */
const hashPassword = async (plainPassword, saltRounds = 10) => {
  try {
    const salt = await bcrypt.genSalt(saltRounds)
    return await bcrypt.hash(plainPassword, salt)
  } catch (err) {
    throw new Error('密码加密失败: ' + err.message)
  }
}

/**
 * 密码验证工具
 * @param {string} plainPassword - 用户输入的明文密码
 * @param {string} hashedPassword - 数据库存储的加密密码
 * @returns {Promise<boolean>} 是否匹配
 */
const verifyPassword = async (plainPassword, hashedPassword) => {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword)
  } catch (err) {
    throw new Error('密码验证失败: ' + err.message)
  }
}

// 导出工具函数
module.exports = { hashPassword, verifyPassword }
