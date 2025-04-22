const { body, oneOf, validationResult, header, param } = require('express-validator')
const { UserModule } = require('../../model')
const { formatResponse, verification, verifyPassword } = require('../../utils')

/** 邮箱验证码发送接口参数校验中间件 */
const validateEmailCaptcha = [
  // 邮箱校验 必填 有效性验证 唯一性验证 转义HTML特殊字符
  body('email')
    .trim() // 清理：去除两端空格
    .notEmpty()
    .withMessage('邮箱不能为空')
    .isEmail()
    .withMessage('邮箱格式无效')
    .normalizeEmail(), // 清理：标准化邮箱（如转小写）

  // 验证码token校验 必填
  body('token').notEmpty().withMessage('验证码token不能为空'),

  // 验证码校验 必填 长度限制
  body('code')
    .notEmpty()
    .withMessage('验证码不能为空')
    .isLength({ min: 4, max: 4 })
    .withMessage('验证码长度需4位')
    .isAlphanumeric()
    .withMessage('验证码只能包含字母和数字'),

  // 检查多余字段
  body().custom((value, { req }) => {
    const allowedFields = ['email', 'token', 'code']
    const extraFields = Object.keys(req.body).filter((field) => !allowedFields.includes(field))

    if (extraFields.length > 0) {
      throw new Error(`包含多余的字段: ${extraFields.join(', ')}`)
    }

    return true
  }),

  // 检查所有校验结果
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json(formatResponse(0, '邮箱验证码发送失败-参数错误', errors.array()))
    }
    next()
  },
]

/** 用户注册参数校验中间件 */
const validateRegistration = [
  body('email')
    .trim() // 清理：去除两端空格
    .notEmpty()
    .withMessage('邮箱不能为空')
    .isEmail()
    .withMessage('邮箱格式无效')
    .normalizeEmail() // 清理：标准化邮箱（如转小写）
    .custom(async (email) => {
      // 自定义校验：检查邮箱是否已注册。
      const user = await UserModule.findOne({ email })
      if (user) {
        throw new Error('邮箱已被注册')
      }
    }),

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

  // 验证码token校验 必填
  body('token').notEmpty().withMessage('验证码token不能为空'),

  // 验证码校验 必填 长度限制
  body('code')
    .notEmpty()
    .withMessage('验证码不能为空')
    .isLength({ min: 6, max: 6 })
    .withMessage('验证码长度需6位')
    .isAlphanumeric()
    .withMessage('验证码只能包含字母和数字'),

  // 检查多余字段
  body().custom((value, { req }) => {
    const allowedFields = ['email', 'password', 'confirmPassword', 'token', 'code']
    const extraFields = Object.keys(req.body).filter((field) => !allowedFields.includes(field))

    if (extraFields.length > 0) {
      throw new Error(`包含多余的字段: ${extraFields.join(', ')}`)
    }

    return true
  }),

  // 检查所有校验结果
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json(formatResponse(0, '用户注册失败-参数错误', errors.array()))
    }
    next()
  },
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
          if (!user) {
            throw new Error('用户uid不存在')
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
          if (!user) {
            throw new Error('手机号不存在')
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
          if (!user) {
            throw new Error('邮箱不存在')
          }
        }),
    ],
    {
      message: '必须提供uid、phone或email中的至少一个字段，并且不能重复',
    }
  ),

  // 密码校验 必填
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
    .isLength({ min: 8, max: 20 })
    .withMessage('密码长度需8-20位')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/) // 正则表达式验证复杂度
    .withMessage('密码需包含大小写字母和数字'),

  // 验证码token校验 必填
  body('token').notEmpty().withMessage('验证码token不能为空'),

  // 验证码校验 必填 长度限制
  body('code')
    .notEmpty()
    .withMessage('验证码不能为空')
    .isLength({ min: 4, max: 4 })
    .withMessage('验证码长度需4位')
    .isAlphanumeric()
    .withMessage('验证码只能包含字母和数字'),

  // 检查多余字段
  body().custom((value, { req }) => {
    const allowedFields = ['uid', 'phone', 'email', 'password', 'token', 'code']
    const extraFields = Object.keys(req.body).filter((field) => !allowedFields.includes(field))

    if (extraFields.length > 0) {
      throw new Error(`包含多余的字段: ${extraFields.join(', ')}`)
    }

    return true
  }),

  // 检查所有校验结果
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json(formatResponse(0, '用户登录失败-参数错误', errors.array()))
    }
    next()
  },
]

/** 用户信息获取参数校验中间件 */
const validateGetInfo = [
  // token校验 可选
  header('Authorization')
    .optional() // 可选参数
    .custom(async (token, { req }) => {
      // 自定义校验：检查token是否有效
      const decoded = await verification(token)
      req.user = decoded

      // 自定义校验：检查用户是否存在
      const user = await UserModule.findById(decoded.id)
      if (!(user && !user.isDeleted)) {
        throw new Error('用户不存在')
      }

      if (!decoded) {
        throw new Error('token失效')
      }
    }),

  param('id')
    .trim() // 清理：去除两端空格
    .notEmpty()
    .withMessage('用户id不能为空')
    .isLength({ min: 24, max: 24 })
    .withMessage('用户id长度需24位')
    .custom(async (id) => {
      // 自定义校验：检查用户是否存在
      const user = await UserModule.findById(id)
      if (!user) {
        throw new Error('用户不存在')
      }
    }),

  // 检查所有校验结果
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json(formatResponse(0, '用户信息获取失败-参数错误', errors.array()))
    }
    next()
  },
]

/** 用户信息更新参数校验中间件 */
const validateUpdate = [
  // token校验 必填
  header('Authorization')
    .notEmpty()
    .withMessage('token不能为空')
    .custom(async (token, { req }) => {
      // 自定义校验：检查token是否有效
      const decoded = await verification(token)
      req.user = decoded

      // 自定义校验：检查用户是否存在
      const user = await UserModule.findById(decoded.id)
      if (!(user && !user.isDeleted)) {
        throw new Error('用户不存在')
      }

      if (!decoded) {
        throw new Error('token失效')
      }
    }),

  body('nickname')
    .trim() // 清理：去除两端空格
    .optional() // 可选参数
    .isLength({ min: 1, max: 10 })
    .withMessage('用户名长度需1-10位')
    .escape(), // 清理：转义HTML特殊字符（防XSS）

  body('avatar')
    .optional()
    .isURL()
    .withMessage('头像链接无效') // 验证：链接有效性
    .isLength({ max: 200 })
    .withMessage('头像链接长度需小于200字符'), // 验证：长度限制

  body('birthday').optional().isDate().withMessage('生日格式无效'),

  body('gender').optional().isIn(['male', 'female', 'hidden']).withMessage('性别值无效'),

  body('bio').optional().isLength({ max: 100 }).withMessage('个人简介长度需小于100字符').escape(),

  // 检查多余字段
  body().custom((value, { req }) => {
    const allowedFields = ['nickname', 'avatar', 'birthday', 'gender', 'bio']
    const extraFields = Object.keys(req.body).filter((field) => !allowedFields.includes(field))

    if (extraFields.length > 0) {
      throw new Error(`包含多余的字段: ${extraFields.join(', ')}`)
    }

    return true
  }),

  // 检查所有校验结果
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json(formatResponse(0, '用户信息更新失败-参数错误', errors.array()))
    }
    next()
  },
]

/** 用户邮箱更改参数校验中间件 */
const validateEmailUpdate = [
  // token校验 必填
  header('Authorization')
    .notEmpty()
    .withMessage('token不能为空')
    .custom(async (token, { req }) => {
      // 自定义校验：检查token是否有效
      const decoded = await verification(token)
      req.user = decoded

      // 自定义校验：检查用户是否存在
      const user = await UserModule.findById(decoded.id)
      if (!(user && !user.isDeleted)) {
        throw new Error('用户不存在')
      }

      if (!decoded) {
        throw new Error('token失效')
      }
    }),

  // 邮箱校验 必填 有效性验证 唯一性验证 转义HTML特殊字符
  body('email')
    .trim() // 清理：去除两端空格
    .notEmpty()
    .withMessage('邮箱不能为空')
    .isEmail()
    .withMessage('邮箱格式无效')
    .normalizeEmail() // 清理：标准化邮箱（如转小写）
    .custom(async (email) => {
      // 自定义校验：检查邮箱是否已注册
      const user = await UserModule.findOne({ email })
      if (!user) {
        throw new Error('用户不存在')
      }
    }),

  // 新邮箱校验 必填 有效性验证 唯一性验证 转义HTML特殊字符
  body('newEmail')
    .trim() // 清理：去除两端空格
    .notEmpty()
    .withMessage('新邮箱不能为空')
    .isEmail()
    .withMessage('新邮箱格式无效')
    .normalizeEmail() // 清理：标准化邮箱（如转小写）
    .custom(async (newEmail, { req }) => {
      // 自定义校验：检查新邮箱是否已注册
      const user = await UserModule.findOne({ email: newEmail })

      // 新邮箱不能和原邮箱相同
      if (user && req.user.id === user.id) {
        throw new Error('新邮箱不能和原邮箱相同')
      }

      if (user) {
        throw new Error('新邮箱已被注册')
      }
    }),

  // 验证码token校验 必填
  body('token').notEmpty().withMessage('验证码token不能为空'),

  // 验证码校验 必填 长度限制
  body('code')
    .notEmpty()
    .withMessage('验证码不能为空')
    .isLength({ min: 6, max: 6 })
    .withMessage('验证码长度需6位')
    .isAlphanumeric()
    .withMessage('验证码只能包含字母和数字'),

  // 检查多余字段
  body().custom((value, { req }) => {
    const allowedFields = ['email', 'newEmail', 'token', 'code']
    const extraFields = Object.keys(req.body).filter((field) => !allowedFields.includes(field))

    if (extraFields.length > 0) {
      throw new Error(`包含多余的字段: ${extraFields.join(', ')}`)
    }

    return true
  }),

  // 检查所有校验结果
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json(formatResponse(0, '用户邮箱更改失败-参数错误', errors.array()))
    }
    next()
  },
]

/** 用户手机号更改参数校验中间件 */
const validatePhoneUpdate = [
  // token校验 必填
  header('Authorization')
    .notEmpty()
    .withMessage('token不能为空')
    .custom(async (token, { req }) => {
      // 自定义校验：检查token是否有效
      const decoded = await verification(token)
      req.user = decoded

      // 自定义校验：检查用户是否存在
      const user = await UserModule.findById(decoded.id)
      if (!(user && !user.isDeleted)) {
        throw new Error('用户不存在')
      }

      if (!decoded) {
        throw new Error('token失效')
      }
    }),

  // 邮箱校验 必填 有效性验证 唯一性验证 转义HTML特殊字符
  body('email')
    .trim() // 清理：去除两端空格
    .notEmpty()
    .withMessage('邮箱不能为空')
    .isEmail()
    .withMessage('邮箱格式无效')
    .normalizeEmail() // 清理：标准化邮箱（如转小写）
    .custom(async (email) => {
      // 自定义校验：检查邮箱是否已注册
      const user = await UserModule.findOne({ email })
      if (!user) {
        throw new Error('用户不存在')
      }
    }),

  // 新手机号校验 必填 有效性验证 唯一性验证 转义HTML特殊字符
  body('newPhone')
    .trim() // 清理：去除两端空格
    .notEmpty()
    .withMessage('新手机号不能为空')
    .isMobilePhone(['zh-CN'])
    .withMessage('新手机号格式无效')
    .custom(async (newPhone, { req }) => {
      // 自定义校验：检查新手机号是否已注册
      const user = await UserModule.findOne({ phone: newPhone })

      // 新手机号不能和原手机号相同
      if (user && req.user.id === user.id) {
        throw new Error('新手机号不能和原手机号相同')
      }

      if (user) {
        throw new Error('新手机号已被注册')
      }
    }),

  // 验证码token校验 必填
  body('token').notEmpty().withMessage('验证码token不能为空'),

  // 验证码校验 必填 长度限制
  body('code')
    .notEmpty()
    .withMessage('验证码不能为空')
    .isLength({ min: 6, max: 6 })
    .withMessage('验证码长度需6位')
    .isAlphanumeric()
    .withMessage('验证码只能包含字母和数字'),

  // 检查多余字段
  body().custom((value, { req }) => {
    const allowedFields = ['email', 'newPhone', 'token', 'code']
    const extraFields = Object.keys(req.body).filter((field) => !allowedFields.includes(field))

    if (extraFields.length > 0) {
      throw new Error(`包含多余的字段: ${extraFields.join(', ')}`)
    }

    return true
  }),

  // 检查所有校验结果
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json(formatResponse(0, '用户手机号更改失败-参数错误', errors.array()))
    }
    next()
  },
]

/** 删除用户参数校验中间件 */
const validateDelete = [
  // token校验 必填
  header('Authorization')
    .notEmpty()
    .withMessage('token不能为空')
    .custom(async (token, { req }) => {
      // 自定义校验：检查token是否有效
      const decoded = await verification(token)
      req.user = decoded

      // 自定义校验：检查用户是否存在
      const user = await UserModule.findById(decoded.id)
      if (!(user && !user.isDeleted)) {
        throw new Error('用户不存在')
      }

      if (!decoded) {
        throw new Error('token失效')
      }
    }),

  // 用户密码校验 必填
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
    .isLength({ min: 8, max: 20 })
    .withMessage('密码长度需8-20位')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/) // 正则表达式验证复杂度
    .withMessage('密码需包含大小写字母和数字')
    .custom(async (value, { req }) => {
      // 自定义校验：检查密码是否正确
      const user = await UserModule.findById(req.user.id)
      // 密码错误
      if (!(await verifyPassword(value, user.password))) {
        throw new Error('密码错误')
      }

      return true
    }),

  // 检查多余字段
  body().custom((value, { req }) => {
    const allowedFields = ['password']
    const extraFields = Object.keys(req.body).filter((field) => !allowedFields.includes(field))

    if (extraFields.length > 0) {
      throw new Error(`包含多余的字段: ${extraFields.join(', ')}`)
    }

    return true
  }),

  // 检查所有校验结果
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json(formatResponse(0, '用户删除失败-参数错误', errors.array()))
    }
    next()
  },
]

/** 用户密码重置参数校验中间件 */
const validatePasswordReset = [
  // token校验 必填
  header('Authorization')
    .notEmpty()
    .withMessage('token不能为空')
    .custom(async (token, { req }) => {
      // 自定义校验：检查token是否有效
      const decoded = await verification(token)
      req.user = decoded

      // 自定义校验：检查用户是否存在
      const user = await UserModule.findById(decoded.id)
      if (!(user && !user.isDeleted)) {
        throw new Error('用户不存在')
      }

      if (!decoded) {
        throw new Error('token失效')
      }
    }),

  // 邮箱校验 必填 有效性验证 唯一性验证 转义HTML特殊字符
  body('email')
    .trim() // 清理：去除两端空格
    .notEmpty()
    .withMessage('邮箱不能为空')
    .isEmail()
    .withMessage('邮箱格式无效')
    .normalizeEmail() // 清理：标准化邮箱（如转小写）
    .custom(async (email) => {
      // 自定义校验：检查邮箱是否已注册
      const user = await UserModule.findOne({ email })
      if (!user) {
        throw new Error('该邮箱无需找回密码')
      }
    }),

  // 验证码token校验 必填
  body('token').notEmpty().withMessage('验证码token不能为空'),

  // 验证码校验 必填 长度限制
  body('code')
    .notEmpty()
    .withMessage('验证码不能为空')
    .isLength({ min: 6, max: 6 })
    .withMessage('验证码长度需6位')
    .isAlphanumeric()
    .withMessage('验证码只能包含字母和数字'),

  // 旧密码校验 必填
  body('oldPassword')
    .notEmpty()
    .withMessage('旧密码不能为空')
    .isLength({ min: 8, max: 20 })
    .withMessage('旧密码长度需8-20位')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/) // 正则表达式验证复杂度
    .withMessage('旧密码需包含大小写字母和数字')
    .custom(async (value, { req }) => {
      // 自定义校验：检查旧密码是否正确
      const user = await UserModule.findById(req.user.id)

      // 旧密码错误
      if (!(await verifyPassword(value, user.password))) {
        throw new Error('旧密码错误')
      }

      // 旧密码与新密码相同
      if (value === req.body.newPassword) {
        throw new Error('新密码不能与旧密码相同')
      }

      return true
    }),

  // 新密码校验 必填 长度限制 复杂度验证
  body('newPassword')
    .notEmpty()
    .withMessage('新密码不能为空')
    .isLength({ min: 8, max: 20 })
    .withMessage('新密码长度需8-20位')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/) // 正则表达式验证复杂度
    .withMessage('新密码需包含大小写字母和数字'),

  // 确认密码校验 必填 自定义校验
  body('confirmPassword')
    .notEmpty()
    .withMessage('请确认密码')
    .custom((value, { req }) => {
      // 自定义校验：对比密码一致性
      if (value !== req.body.newPassword) {
        throw new Error('两次输入的新密码不一致')
      }
      return true
    }),

  // 检查多余字段
  body().custom((value, { req }) => {
    const allowedFields = [
      'email',
      'token',
      'code',
      'oldPassword',
      'newPassword',
      'confirmPassword',
    ]
    const extraFields = Object.keys(req.body).filter((field) => !allowedFields.includes(field))

    if (extraFields.length > 0) {
      throw new Error(`包含多余的字段: ${extraFields.join(', ')}`)
    }

    return true
  }),

  // 检查所有校验结果
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json(formatResponse(0, '用户密码重置失败-参数错误', errors.array()))
    }
    next()
  },
]

/** 用户退出登录参数校验中间件 */
const validateLogout = [
  // token校验 必填
  header('Authorization')
    .notEmpty()
    .withMessage('token不能为空')
    .custom(async (token, { req }) => {
      // 自定义校验：检查token是否有效
      const decoded = await verification(token)
      req.user = decoded

      // 自定义校验：检查用户是否存在
      const user = await UserModule.findById(decoded.id)
      if (!(user && !user.isDeleted)) {
        throw new Error('用户不存在')
      }

      if (!decoded) {
        throw new Error('token失效')
      }
    }),

  // 检查所有校验结果
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json(formatResponse(0, '用户退出登录失败-参数错误', errors.array()))
    }
    next()
  },
]

module.exports = {
  validateEmailCaptcha,
  validateRegistration,
  validateLogin,
  validateUpdate,
  validateGetInfo,
  validateDelete,
  validatePasswordReset,
  validateLogout,
  validateEmailUpdate,
  validatePhoneUpdate,
}
