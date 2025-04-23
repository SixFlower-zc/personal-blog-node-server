const jose = require('jose')

// 定义一个密钥 (默认使用环境变量) (密钥长度必须为 32 字节)
const secret = new TextEncoder().encode(
  process.env.JWT_SECERT_KEY || '652ebc195a3b2157f281606eaa737fdd0b8239b919c1cf0a58a33f64aaa0d150'
)

/**
 * 加密 JWT
 * @param {*} payload 有效负载
 * @param {string} expiresIn 有效期 (默认1h)(单位: s/m/h/d) 不能使用混合单位
 * @returns {Promise<string>} 加密后的 JWT
 */
const encryption = async (payload, expiresIn = '1h') => {
  try {
    // 校验 payload 格式
    if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
      throw new Error('Payload 必须是包含数据的非空对象')
    }

    // 校验 expiresIn 格式
    const isValidFormat =
      typeof expiresIn === 'string' &&
      (/^\d+[smhd]$/.test(expiresIn) || // 相对时间
        !isNaN(Date.parse(expiresIn))) // 绝对时间

    if (!isValidFormat) {
      throw new Error('expiresIn 格式无效，示例: "30s", "1h", "2024-12-31T23:59:59Z"')
    }

    // 生成 Token
    const token = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(secret)

    return token
  } catch (error) {
    // 捕获算法配置错误
    if (error.message.includes('algorithm')) {
      throw new Error('不支持的加密算法，请使用 HS256')
    }
    // 捕获过期时间格式错误
    if (error.message.includes('expiration time')) {
      throw new Error(`无效的过期时间格式: ${expiresIn}`)
    }
    // 统一错误前缀
    throw new Error(`JWT 生成失败: ${error.message}`)
  }
}

/**
 * 解密 JWT
 * @param {*} token 加密后的 JWT
 * @returns {Promise<object>} 解码后的有效负载
 */
const verification = async (token) => {
  try {
    // 校验 Token 格式
    if (!token || typeof token !== 'string') {
      throw new Error('Token 必须是字符串')
    }

    const tokenParts = token.split('.')
    if (tokenParts.length !== 3) {
      throw new Error('Token 格式错误，应包含三部分')
    }

    // 验证 Token
    const { payload } = await jose.jwtVerify(token, secret)
    return payload
  } catch (error) {
    // 分类处理已知错误类型
    if (error instanceof jose.errors.JWTExpired) {
      throw new Error('登录已过期，请重新登录')
    }
    if (error instanceof jose.errors.JWSInvalid) {
      throw new Error('Token 无效')
    }
    if (error instanceof jose.errors.JWTInvalid) {
      throw new Error('Token 格式错误')
    }
    // 未知错误统一处理
    throw new Error(`Token 验证失败: ${error.message}`)
  }
}

module.exports = {
  encryption,
  verification,
}
