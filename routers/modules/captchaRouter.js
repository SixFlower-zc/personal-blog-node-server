const express = require('express')
const { v4: uuidv4 } = require('uuid')
const svgCaptcha = require('svg-captcha')

const router = express.Router()

const { formatResponse, sendEmail, validateCaptcha } = require('../../utils')
const client = require('../../config/redisConfig')
const { jsonParser } = require('../../middlewares')
const { validateEmailCaptcha } = require('../../lib')

// 生成配置
const svgCaptchaConfig = {
  size: 4, // 验证码长度
  noise: 3, // 干扰线数量
  color: true, // 彩色字符
  ignoreChars: '0o1i', // 排除易混淆字符
  background: '#f6f6f6', // 背景颜色
  rotate: true, // 随机旋转
  width: 120, // 图片宽度
  height: 40, // 图片高度
  ignoreCase: true, // 大小写
}

// !: 获取验证码
router.get('/', async (req, res) => {
  try {
    const token = uuidv4() // 唯一标识
    const captcha = svgCaptcha.create(svgCaptchaConfig)

    // Redis存储（5分钟过期）
    await client.setEx(`svgCode:${token}`, 300, captcha.text.toLowerCase())

    res.status(200).json(
      formatResponse(1, '获取验证码成功', {
        token,
        code: captcha.text.toLowerCase(),
        svg: captcha.data,
      })
    )
  } catch (err) {
    console.error(`[svgCode] 生成失败: ${err.message}`)
    res.status(503).json(formatResponse(0, '生成失败', { message: err.message }))
  }
})

const strCaptchaConfig = {
  size: 6, // 验证码长度
  ignoreChars: '0o1i', // 排除易混淆字符
}

// !: 用户邮箱邮件验证码发送
router.post('/email', [jsonParser, validateEmailCaptcha], async (req, res) => {
  if (await validateCaptcha('svgCode', req, res)) {
    return
  }

  const token = uuidv4() // 唯一标识
  const captcha = svgCaptcha.create(strCaptchaConfig)

  const { email } = req.body
  console.log(`[emailCode] 发送验证码给 ${email}`)

  // Redis存储（5分钟过期）
  await client.setEx(`emailCode:${email}:${token}`, 300, captcha.text.toLowerCase())

  const emailContent = `
    <p>您好，欢迎注册我们的网站！</p>
    <p>您的验证码是：<strong>${captcha.text}</strong></p>
    <p>为了确保您的账号安全，请在注册页面输入此验证码。</p>
    <p>如果这不是您本人的操作，请忽略此邮件。</p>
  `

  // TODO: 发送验证邮件
  sendEmail(email, '测试邮件', emailContent)

  res
    .status(200)
    .json(formatResponse(1, '验证邮件已发送', { token, code: captcha.text.toLowerCase() }))
})

module.exports = router
