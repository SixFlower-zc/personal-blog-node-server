const express = require('express')
const { formatResponse, validateCaptcha, encryption } = require('../../utils')
const { jsonParser } = require('../../middlewares')
const {
  validateLogin,
  validateRegistration,
  validatePasswordReset,
  validateGetInfo,
  validateLogout,
  validateDelete,
  validateUpdate,
  validateEmailUpdate,
  validatePhoneUpdate,
} = require('../../lib')
const client = require('../../config/redisConfig')
const {
  registerUser,
  loginUser,
  getUserById,
  resetPassword,
  updateUser,
  softDeleteUser,
  addUserVisitor,
  incrementUserViews,
} = require('../../api')
const crypto = require('crypto')

const router = express.Router()

// !: 用户注册
router.post('/register', [jsonParser, validateRegistration], async (req, res) => {
  // 参数校验通过
  // 验证码校验
  if (await validateCaptcha(`emailCode:${req.body.email}`, req, res)) {
    return
  }

  const { email, password } = req.body

  // ?: 注册逻辑
  try {
    const result = await registerUser({ password, email, ip: req.ip })
    console.log(result)

    res.status(200).json(
      formatResponse(1, '账号注册成功', {
        id: result.id,
        uid: result.uid,
        email: result.email,
      })
    )
  } catch (err) {
    throw err
  }
})

// !: 用户登录
router.post('/login', [jsonParser, validateLogin], async (req, res) => {
  if (await validateCaptcha('svgCode', req, res)) {
    return
  }

  const { uid, phone, email, password } = req.body

  // ?: 登录逻辑
  const result = await loginUser({
    uid,
    phone,
    email,
    password,
    ip: req.ip,
  })

  if (!result) {
    return res.status(401).json(formatResponse(0, '用户名或密码错误'))
  }

  // 生成 Access Token（JWT）
  const token = await encryption({
    id: result.id,
    uid: result.uid,
    iat: Date.now(),
    exp: Date.now() + 3600 * 1000,
  })

  // 生成 Refresh Token（Redis）
  const refreshToken = crypto.randomBytes(64).toString('hex') // 生成高强度随机字符串

  await client.setEx(
    `refreshToken:${refreshToken}`,
    7 * 24 * 3600,
    JSON.stringify({
      id: result.id,
      uid: result.uid,
      valid: true,
      deviceInfo: req.headers['user-agent'], // 记录设备信息用于安全验证,用于防止token被盗用
    })
  )

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true, // 禁止 JavaScript 读取
    secure: true, // 仅通过 HTTPS 传输
    sameSite: 'none', // 跨域时允许 Cookie 被发送
    maxAge: 7 * 24 * 3600 * 1000, // 过期时间（毫秒）
    path: '/user/token/refresh', // 限制 Cookie 仅对刷新接口有效
  })

  res.status(200).json(formatResponse(1, '用户登录成功', { token }))
})

// !: token 刷新
router.post('/token/refresh', async (req, res) => {
  const { refreshToken } = req.cookies

  // ?: 刷新 token 逻辑
  if (!refreshToken) {
    return res.status(401).json(formatResponse(0, '请先登录'))
  }

  // 从 Redis 中验证 Refresh Token 有效性
  const storedTokenData = await client.get(`refreshToken:${refreshToken}`)
  if (!storedTokenData) {
    return res.status(401).json({ error: '无效的 Refresh Token' })
  }

  // 解析存储的 Token 数据（包含设备信息）
  const { valid, deviceInfo, id, uid } = JSON.parse(storedTokenData)
  if (!valid || deviceInfo !== req.headers['user-agent']) {
    // 设备信息不匹配可能为 Token 盗用
    await client.del(`refreshToken:${refreshToken}`) // 立即失效旧 Token
    return res.status(401).json({ error: '设备验证失败' })
  }

  // 生成新的 Access Token（JWT）
  const token = await encryption({
    id: id,
    uid: uid,
    iat: Date.now(),
    exp: Date.now() + 3600 * 1000,
  })

  // 滚动刷新 Refresh Token
  // 生成新 Refresh Token 并替换旧 Token（增强安全性）
  const newRefreshToken = crypto.randomBytes(64).toString('hex')

  // 删除旧 Token
  await client.del(`refreshToken:${refreshToken}`)

  await client.setEx(
    `refreshToken:${newRefreshToken}`,
    7 * 24 * 3600,
    JSON.stringify({
      id: id,
      uid: uid,
      valid: true,
      deviceInfo: req.headers['user-agent'], // 记录设备信息用于安全验证,用于防止token被盗用
    })
  )

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true, // 禁止 JavaScript 读取
    secure: true, // 仅通过 HTTPS 传输
    sameSite: 'none', // 跨域时允许 Cookie 被发送
    maxAge: 7 * 24 * 3600 * 1000, // 过期时间（毫秒）
    path: '/user/token/refresh', // 限制 Cookie 仅对刷新接口有效
  })

  res.status(200).json(formatResponse(1, 'token 刷新成功', { token }))
})

// !: 用户信息获取
router.get('/info/:id', [jsonParser, validateGetInfo], async (req, res) => {
  const { id: infoId } = req.params

  // ?: 获取用户信息

  const result = await getUserById(infoId)

  // 如果携带token
  if (req.user) {
    const { id: userId } = req.user

    // 如果发起请求者是本人，则返回完整信息
    if (userId === infoId) {
      res.status(200).json(formatResponse(1, '获取用户信息成功', result))
      return
    }
    addUserVisitor(infoId, userId) // 增加用户访问列表
  }

  // 否则只返回部分信息
  incrementUserViews(infoId) // 增加用户浏览量
  const { id, uid, avatar, nickname, gender, birthday, bio } = result

  res
    .status(200)
    .json(
      formatResponse(1, '获取用户信息成功', { id, uid, avatar, nickname, gender, birthday, bio })
    )
})

// !: 用户信息更改
router.post('/info', [jsonParser, validateUpdate], async (req, res) => {
  const { id } = req.user

  // ?: 更新用户信息

  await updateUser(id, req.body)

  const result = await getUserById(id)

  res.status(200).json(formatResponse(1, '用户信息更新成功', result))
})

// !: 账户邮箱更改
router.post('/email', [jsonParser, validateEmailUpdate], async (req, res) => {
  // 参数校验通过
  // 验证码校验
  if (await validateCaptcha(`emailCode:${req.body.email}`, req, res)) {
    return
  }

  const { id } = req.user

  // ?: 更新用户邮箱
  await updateUser(id, { email: req.body.newEmail })

  const result = await getUserById(id)

  res.status(200).json(formatResponse(1, '用户邮箱更新成功', result))
})

// !: 用户手机号更改
router.post('/phone', [jsonParser, validatePhoneUpdate], async (req, res) => {
  // 参数校验通过
  // 验证码校验
  if (await validateCaptcha(`emailCode:${req.body.email}`, req, res)) {
    return
  }

  const { id } = req.user

  // ?: 更新用户手机号

  await updateUser(id, { phone: req.body.newPhone })

  const result = await getUserById(id)

  res.status(200).json(formatResponse(1, '用户手机号更新成功', result))
})

// !: 用户密码找回
router.post('/password-reset', [jsonParser, validatePasswordReset], async (req, res) => {
  if (await validateCaptcha(`emailCode:${req.body.email}`, req, res)) {
    return
  }

  const { email, newPassword } = req.body

  // TODO: 密码找回逻辑

  resetPassword(email, newPassword)

  res.status(200).json(formatResponse(1, '密码重置成功'))
})

// !: 用户退出登录
router.post('/logout', [validateLogout], async (req, res) => {
  res.cookie('refreshToken', '', {
    httpOnly: true, // 禁止 JavaScript 读取
    secure: true, // 仅通过 HTTPS 传输
    sameSite: 'none', // 跨域时允许 Cookie 被发送
    path: '/user/token/refresh', // 限制 Cookie 仅对刷新接口有效
  })

  res.status(200).json(formatResponse(1, '退出登陆成功'))
})

// !: 用户删除(软删除)
router.delete('/delete', [validateDelete], async (req, res) => {
  const { id } = req.user

  // ?: 删除逻辑
  await softDeleteUser(id)

  res.status(200).json(formatResponse(1, '用户删除成功'))
})

module.exports = router
