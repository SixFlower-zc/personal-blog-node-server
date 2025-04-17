const { body, oneOf } = require('express-validator')
const { UserModule } = require('../../model')

/** 用户注册参数校验中间件 */
const validateRegistration = [
  // 密码校验 必填 长度限制 复杂度验证
  body('password')
    .notEmpty()
    .withMessage('密码不能为空') // 验证：必填
    .isLength({ min: 8, max: 20 })
    .withMessage('密码长度需8-20位') // 验证：长度限制
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/) // 正则表达式验证复杂度
    .withMessage('密码需包含大小写字母和数字'),

  // 确认密码校验 必填 自定义校验
  body('confirmPassword')
    .notEmpty()
    .withMessage('请确认密码')
    .custom((value, { req }) => {
      // 自定义校验：对比密码一致性
      if (value !== req.body.password) {
        throw new Error('两次输入的密码不一致')
      }
      return true
    }),

  // 用户名校验 必填 长度限制 转义HTML特殊字符
  body('nickname')
    .trim()
    .notEmpty()
    .withMessage('用户名不能为空')
    .isLength({ min: 1, max: 10 })
    .withMessage('用户名长度需1-10位')
    .escape(), // 清理：转义HTML特殊字符（防XSS）

  // 头像链接校验 可选 有效性验证 长度限制
  body('avatar')
    .optional()
    .isURL()
    .withMessage('头像链接无效') // 验证：链接有效性
    .isLength({ max: 200 })
    .withMessage('头像链接长度需小于200字符'), // 验证：长度限制

  // 邮箱校验 可选 有效性验证 唯一性验证 转义HTML特殊字符
  body('email')
    .trim() // 清理：去除两端空格
    .optional() // 可选参数
    .isEmail()
    .withMessage('邮箱格式无效') // 验证：符合邮箱格式
    .normalizeEmail() // 清理：标准化邮箱（如转小写）
    .custom(async (email) => {
      // 自定义校验：检查邮箱是否已注册
      const user = await UserModule.findOne({ email })
      if (user) {
        throw new Error('邮箱已被注册')
      }
    }),

  // 手机号校验 可选 有效性验证 唯一性验证
  body('phone')
    .trim() // 清理：去除两端空格
    .optional() // 可选参数
    .isMobilePhone(['zh-CN'])
    .withMessage('手机号格式无效') // 验证：符合手机号格式
    .custom(async (phone) => {
      // 自定义校验：检查手机号是否已注册
      const user = await UserModule.findOne({ phone })
      if (user) {
        throw new Error('手机号已被注册')
      }
    }),

  // 生日校验 可选 有效性验证
  body('birthday').optional().isDate().withMessage('生日格式无效'),

  // 性别校验 可选 值范围验证
  body('gender').optional().isIn(['male', 'female', 'hidden']).withMessage('性别值无效'),

  // 个人简介校验 可选 长度限制 转义HTML特殊字符
  body('bio').optional().isLength({ max: 100 }).withMessage('个人简介长度需小于100字符').escape(),

  // 注册IP校验 必选
  body('registerIP').notEmpty().withMessage('注册IP不能为空'),
]

/**用户登录参数校验中间件 */
const validateLogin = [
  // 三选一校验
  oneOf(
    [
      body('uid')
        .trim() // 清理：去除两端空格
        .notEmpty()
        .withMessage('用户uid不能为空')
        .isLength({ min: 6, max: 6 })
        .withMessage('用户uid长度需6位')
        .custom(async (uid) => {
          // 自定义校验：检查用户是否存在
          const user = await UserModule.findOne({ uid })
          if (user) {
            throw new Error('用户uid已存在')
          }
        }),

      body('phone')
        .trim() // 清理：去除两端空格
        .notEmpty()
        .withMessage('手机号不能为空')
        .isMobilePhone(['zh-CN'])
        .withMessage('手机号格式无效')
        .custom(async (phone) => {
          // 自定义校验：检查手机号是否存在
          const user = await UserModule.findOne({ phone })
          if (user) {
            throw new Error('手机号已存在')
          }
        }),

      body('email')
        .trim() // 清理：去除两端空格
        .notEmpty()
        .withMessage('邮箱不能为空')
        .isEmail()
        .withMessage('邮箱格式无效')
        .normalizeEmail() // 清理：标准化邮箱（如转小写）
        .custom(async (email) => {
          // 自定义校验：检查邮箱是否存在
          const user = await UserModule.findOne({ email })
          if (user) {
            throw new Error('邮箱已存在')
          }
        }),
    ],
    '必须提供uid、phone或email中的至少一个，并且不能重复'
  ),

  // 密码校验 必填
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
    .isLength({ min: 8, max: 20 })
    .withMessage('密码长度需8-20位')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/) // 正则表达式验证复杂度
    .withMessage('密码需包含大小写字母和数字'),
]

module.exports = { validateRegistration, validateLogin }
