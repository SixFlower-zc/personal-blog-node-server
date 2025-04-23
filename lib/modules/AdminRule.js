const { body, validationResult, header, param } = require('express-validator')
const { AdminModule } = require('../../model')
const { formatResponse, verification, verifyPassword } = require('../../utils')
const { adminAuthorizationUtil } = require('../authorizationUtil')

/** 管理员登录参数校验中间件 */
const validateAdminLogin = [
  // 管理员ID校验 必填 长度限制
  body('aid')
    .trim()
    .notEmpty()
    .withMessage('管理员ID不能为空')
    .isLength({ min: 6, max: 6 })
    .withMessage('管理员ID长度需6位')
    .custom(async (aid) => {
      const admin = await AdminModule.findOne({ aid })
      if (!admin) {
        throw new Error('管理员ID不存在')
      }
    }),

  // 密码校验 必填 长度限制
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
    .isLength({ min: 8, max: 20 })
    .withMessage('密码长度需8-20位')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('密码需包含大小写字母和数字'),

  // 检查多余字段
  body().custom((value, { req }) => {
    const allowedFields = ['aid', 'password']
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
      return res.status(400).json(formatResponse(0, '管理员登录失败-参数错误', errors.array()))
    }
    next()
  },
]

/** 管理员创建参数校验中间件 */
const validateAdminCreate = [
  // 密码校验 必填 长度限制
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
    .isLength({ min: 8, max: 20 })
    .withMessage('密码长度需8-20位')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('密码需包含大小写字母和数字'),

  // 昵称校验 必填 长度限制
  body('nickname')
    .trim()
    .notEmpty()
    .withMessage('昵称不能为空')
    .isLength({ min: 1, max: 10 })
    .withMessage('昵称长度需1-10位')
    .escape(),

  // 邮箱校验 必填 有效性验证 唯一性验证
  body('email')
    .trim()
    .notEmpty()
    .withMessage('邮箱不能为空')
    .isEmail()
    .withMessage('邮箱格式无效')
    .normalizeEmail()
    .custom(async (email) => {
      const admin = await AdminModule.findOne({ email })
      if (admin) {
        throw new Error('邮箱已被注册')
      }
    }),

  // 权限等级校验 必填 枚举值
  body('role')
    .notEmpty()
    .withMessage('权限等级不能为空')
    .isInt()
    .withMessage('权限等级必须是整数')
    .custom((value) => {
      const validRoles = [1, 2, 3] // 假设权限等级为1-3
      if (!validRoles.includes(value)) {
        throw new Error('权限等级无效')
      }
      return true
    }),

  // 检查多余字段
  body().custom((value, { req }) => {
    const allowedFields = ['password', 'nickname', 'email', 'role']
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
      return res.status(400).json(formatResponse(0, '管理员创建失败-参数错误', errors.array()))
    }
    next()
  },
]

/** 管理员更新参数校验中间件 */
const validateAdminUpdate = [
  // token校验 必填
  header('Authorization')
    .notEmpty()
    .withMessage('token不能为空')
    .custom(async (token, { req }) => {
      // 普通用户token校验并处理token
      await adminAuthorizationUtil(token, req)
    }),

  // 管理员ID校验 必填
  param('id')
    .notEmpty()
    .withMessage('管理员ID不能为空')
    .custom(async (value, { req }) => {
      const admin = await AdminModule.findById(value)
      if (!admin || admin.isDeleted) {
        throw new Error('管理员不存在')
      }
      // 只有超级管理员可以修改其他管理员信息
      if (req.user.role !== 1 && req.user.id !== value) {
        throw new Error('无权修改该管理员信息')
      }
      return true
    }),

  // 昵称校验 可选 长度限制
  body('nickname')
    .optional()
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('昵称长度需1-10位')
    .escape(),

  // 邮箱校验 可选 有效性验证 唯一性验证
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('邮箱格式无效')
    .normalizeEmail()
    .custom(async (email, { req }) => {
      const admin = await AdminModule.findOne({ email })
      if (admin && admin._id.toString() !== req.params.id) {
        throw new Error('邮箱已被使用')
      }
    }),

  // 权限等级校验 可选 枚举值
  body('role')
    .optional()
    .isInt()
    .withMessage('权限等级必须是整数')
    .custom((value) => {
      const validRoles = [1, 2, 3]
      if (!validRoles.includes(value)) {
        throw new Error('权限等级无效')
      }
      return true
    }),

  // 检查多余字段
  body().custom((value, { req }) => {
    const allowedFields = ['nickname', 'email', 'role']
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
      return res.status(400).json(formatResponse(0, '管理员更新失败-参数错误', errors.array()))
    }
    next()
  },
]

/** 管理员删除参数校验中间件 */
const validateAdminDelete = [
  // token校验 必填
  header('Authorization')
    .notEmpty()
    .withMessage('token不能为空')
    .custom(async (token, { req }) => {
      // 普通用户token校验并处理token
      await adminAuthorizationUtil(token, req)
    }),

  // 管理员ID校验 必填
  param('id')
    .notEmpty()
    .withMessage('管理员ID不能为空')
    .custom(async (value, { req }) => {
      const admin = await AdminModule.findById(value)
      if (!admin || admin.isDeleted) {
        throw new Error('管理员不存在')
      }
      // 只有超级管理员可以删除其他管理员
      if (req.user.role !== 1) {
        throw new Error('无权删除管理员')
      }
      // 不能删除自己
      if (req.user.id === value) {
        throw new Error('不能删除自己')
      }
      return true
    }),

  // 检查所有校验结果
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json(formatResponse(0, '管理员删除失败-参数错误', errors.array()))
    }
    next()
  },
]

module.exports = {
  validateAdminLogin,
  validateAdminCreate,
  validateAdminUpdate,
  validateAdminDelete,
}
