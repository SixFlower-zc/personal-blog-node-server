const nodemailer = require('nodemailer')

/**
 * 发送邮件
 * @param {string} to 收件人邮箱
 * @param {string} subject 邮件主题 (标题)
 * @param {string} html 邮件内容 (html 格式)
 */
const sendEmail = async (to, subject, html) => {
  try {
    // 生成测试账户
    const testAccount = await nodemailer.createTestAccount()

    // 创建传输器（使用 Ethereal 的 SMTP 配置）
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // 必须为 false，使用 STARTTLS
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })

    // 发送邮件
    const info = await transporter.sendMail({
      from: '"测试发件人" <sender@example.com>',
      to,
      subject,
      html,
    })

    // 获取邮件在线查看链接
    console.log('邮件预览链接:', nodemailer.getTestMessageUrl(info))
    return '邮件预览链接:' + nodemailer.getTestMessageUrl(info)
  } catch (err) {
    throw new Error(`邮件发送失败: ${err.message}`)
  }
}

// sendEmail('12345678910@qq.com', '测试邮件内容')

module.exports = sendEmail
