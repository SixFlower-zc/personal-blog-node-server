const formatResponse = require('./responseFormatter')
const client = require('../../config/redisConfig')

/**
 * 验证验证码
 * @param {string} fieldName  字段名 用于区分验证码用途
 * @param {express.Request} req 请求对象
 * @param {express.Response} res 响应对象
 */
const validateCaptcha = async (fieldName, req, res) => {
  const { token, code } = req.body

  try {
    // 获取验证码
    const storedCode = await client.get(`${fieldName}:${token}`)

    // 自动清理机制
    if (!storedCode) {
      await client.del(`${fieldName}:${token}`) // 防御性删除
      return res.status(401).json(formatResponse(0, '验证码已过期', {}))
    }

    // 验证逻辑（不区分大小写）
    if (code.toLowerCase() !== storedCode) {
      await client.del(`${fieldName}:${token}`) // 立即失效
      return res.status(401).json(formatResponse(0, '验证码错误', {}))
    }

    // 验证通过后清理
    await client.del(`${fieldName}:${token}`)
  } catch (err) {
    console.error(`[${fieldName}] 验证失败: ${err.message}`)
    return res.status(500).json(formatResponse(0, '验证码验证失败', {}))
  }
}

module.exports = validateCaptcha
