const jose = require('jose')

// 定义一个密钥
const secret = new TextEncoder().encode(
  '652ebc195a3b2157f281606eaa737fdd0b8239b919c1cf0a58a33f64aaa0d150'
)

// 生成 JWT
const encryption = async (payload) => {
  const token = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' }) // 设置算法
    .setIssuedAt() // 设置签发时间
    .setExpirationTime('24h') // 设置到期时间为24小时
    .sign(secret) // 签名
  return token
}

// 验证 JWT
const verification = async (token) => {
  try {
    const { payload } = await jose.jwtVerify(token, secret)
    return payload // 返回解码后的有效负载
  } catch (error) {
    console.log('验证失败:', error)
    throw new Error('无效的JWT') // 如果验证失败，抛出异常
  }
}

module.exports = {
  encryption,
  verification,
}
