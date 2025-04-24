const { body, validationResult, header, param, query } = require('express-validator')
const { ProjectModule, PhotoModule, UserModule } = require('../../model')
const { formatResponse } = require('../../utils')
const { userAuthorizationUtil } = require('../authorizationUtil')

/** 项目创建参数校验中间件 */
const validateProjectCreate = [
  // token校验 必填
  header('Authorization')
    .notEmpty()
    .withMessage('token不能为空')
    .custom(async (token, { req }) => {
      // 普通用户token校验并处理token
      await userAuthorizationUtil(token, req)
    }),

  // 项目标题 必填 长度限制 防XSS
  body('title')
    .notEmpty()
    .withMessage('项目标题不能为空')
    .isLength({ min: 1, max: 50 })
    .withMessage('项目标题长度必须在1-50个字符之间')
    .escape(),

  // 项目描述 非必填 长度限制 防XSS
  body('description')
    .optional()
    .isLength({ max: 100 })
    .withMessage('项目描述长度不能超过100个字符')
    .escape(),

  // 技术栈标签 非必填 数组
  body('techStack')
    .optional()
    .isArray()
    .withMessage('技术栈必须是一个数组')
    .custom((value) => {
      if (value.length > 10) {
        throw new Error('技术栈标签数量不能超过10个')
      }
      const tagRegex = /^[a-zA-Z0-9\u4e00-\u9fa5]+$/
      for (const tag of value) {
        if (!tagRegex.test(tag)) {
          throw new Error('技术栈标签只能包含字母、数字、中文')
        }
        if (tag.length > 15) {
          throw new Error('技术栈标签长度不能超过15个字符')
        }
      }
      return true
    }),

  // 演示地址 可选 URL格式
  body('demoUrl')
    .optional()
    .isURL()
    .withMessage('演示地址必须是有效的URL格式')
    .custom((value, { req }) => {
      if (value.startsWith('http://localhost') || value.startsWith('http://127.0.0.1')) {
        throw new Error('演示地址不能是本地地址')
      }
      return true
    }),

  // GitHub地址 可选 URL格式
  body('githubUrl')
    .optional()
    .isURL()
    .withMessage('GitHub地址必须是有效的URL格式')
    .custom((value) => {
      // 检查是否为github链接
      if (!value.startsWith('https://github.com/')) {
        throw new Error('GitHub地址必须是github.com开头的URL格式')
      }
      return true
    }),

  // Gitee地址 可选 URL格式
  body('giteeUrl')
    .optional()
    .isURL()
    .withMessage('Gitee地址必须是有效的URL格式')
    .custom((value) => {
      // 检查是否为gitee链接
      if (!value.startsWith('https://gitee.com/')) {
        throw new Error('Gitee地址必须是gitee.com开头的URL格式')
      }
      return true
    }),

  // 封面图 可选 ObjectId
  body('cover')
    .optional()
    .isMongoId()
    .withMessage('封面图ID格式不正确')
    .custom(async (value, { req }) => {
      const cover = await PhotoModule.findById(value)
      if (!cover || cover.isDeleted) {
        throw new Error('封面图不存在')
      }

      if (cover.toJSON().creator !== req.user.id) {
        throw new Error('无权使用该封面图')
      }

      req.body.cover = cover.toJSON().id
    }),

  // 是否置顶 可选 布尔值
  body('isTop').optional().isBoolean().withMessage('是否置顶必须是一个布尔值'),

  // 权重 可选 数字
  body('weight').optional().isNumeric().withMessage('权重必须是一个数字'),

  // 是否公开 必填 布尔值
  body('isPublic')
    .notEmpty()
    .withMessage('是否公开不能为空')
    .isBoolean()
    .withMessage('是否公开必须是一个布尔值'),

  // 检查多余字段
  body().custom((value, { req }) => {
    const allowedFields = [
      'title',
      'description',
      'techStack',
      'demoUrl',
      'githubUrl',
      'giteeUrl',
      'cover',
      'isTop',
      'weight',
      'isPublic',
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
      return res.status(400).json(formatResponse(0, '参数校验失败', errors.array()))
    }
    next()
  },
]

/** 项目详情获取参数校验中间件 */
const validateProjectDetail = [
  // token校验 可选
  header('Authorization')
    .optional()
    .custom(async (token, { req }) => {
      // 普通用户token校验并处理token
      await userAuthorizationUtil(token, req)
    }),

  // 项目ID 必填
  param('id')
    .notEmpty()
    .withMessage('项目ID不能为空')
    .isMongoId()
    .withMessage('项目ID格式不正确')
    .custom(async (value, { req }) => {
      const project = await ProjectModule.findById(value)
      if (!project || project.isDeleted) {
        throw new Error('项目不存在')
      }
      return true
    }),

  // 检查多余字段
  param().custom((value, { req }) => {
    const allowedFields = ['id']
    const extraFields = Object.keys(req.params).filter((field) => !allowedFields.includes(field))

    if (extraFields.length > 0) {
      throw new Error(`包含多余的字段: ${extraFields.join(', ')}`)
    }

    return true
  }),

  // 检查所有校验结果
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json(formatResponse(0, '参数校验失败', errors.array()))
    }
    next()
  },
]

/** 项目更新参数校验中间件 */
const validateProjectUpdate = [
  // token校验 必填
  header('Authorization')
    .notEmpty()
    .withMessage('token不能为空')
    .custom(async (token, { req }) => {
      // 普通用户token校验并处理token
      await userAuthorizationUtil(token, req)
    }),

  // 项目ID 必填
  param('id')
    .notEmpty()
    .withMessage('项目ID不能为空')
    .isMongoId()
    .withMessage('项目ID格式不正确')
    .custom(async (value, { req }) => {
      const project = await ProjectModule.findById(value)
      if (!project || project.isDeleted) {
        throw new Error('项目不存在')
      }
      if (project.creator.toString() !== req.user.id) {
        throw new Error('无权修改该项目')
      }
      return true
    }),

  // 项目标题 可选 长度限制 防XSS
  body('title')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('项目标题长度必须在1-50个字符之间')
    .escape(),

  // 项目描述 可选 长度限制 防XSS
  body('description')
    .optional()
    .isLength({ max: 100 })
    .withMessage('项目描述长度不能超过100个字符')
    .escape(),

  // 技术栈标签 可选 数组
  body('techStack')
    .optional()
    .isArray()
    .withMessage('技术栈必须是一个数组')
    .custom((value) => {
      if (value.length > 10) {
        throw new Error('技术栈标签数量不能超过10个')
      }
      const tagRegex = /^[a-zA-Z0-9\u4e00-\u9fa5]+$/
      for (const tag of value) {
        if (!tagRegex.test(tag)) {
          throw new Error('技术栈标签只能包含字母、数字、中文')
        }
        if (tag.length > 15) {
          throw new Error('技术栈标签长度不能超过15个字符')
        }
      }
      return true
    }),

  // 演示地址 可选 URL格式
  body('demoUrl')
    .optional()
    .isURL()
    .withMessage('演示地址必须是有效的URL格式')
    .custom((value, { req }) => {
      if (value.startsWith('http://localhost') || value.startsWith('http://127.0.0.1')) {
        throw new Error('演示地址不能是本地地址')
      }
      return true
    }),

  // GitHub地址 可选 URL格式
  body('githubUrl')
    .optional()
    .isURL()
    .withMessage('GitHub地址必须是有效的URL格式')
    .custom((value) => {
      // 检查是否为github链接
      if (!value.startsWith('https://github.com/')) {
        throw new Error('GitHub地址必须是github.com开头的URL格式')
      }
      return true
    }),

  // Gitee地址 可选 URL格式
  body('giteeUrl')
    .optional()
    .isURL()
    .withMessage('Gitee地址必须是有效的URL格式')
    .custom((value) => {
      // 检查是否为gitee链接
      if (!value.startsWith('https://gitee.com/')) {
        throw new Error('Gitee地址必须是gitee.com开头的URL格式')
      }
      return true
    }),

  // 封面图 可选 ObjectId
  body('cover').optional().isMongoId().withMessage('封面图ID格式不正确'),

  // 是否置顶 可选 布尔值
  body('isTop').optional().isBoolean().withMessage('是否置顶必须是一个布尔值'),

  // 权重 可选 数字
  body('weight').optional().isNumeric().withMessage('权重必须是一个数字'),

  // 是否公开 可选 布尔值
  body('isPublic').optional().isBoolean().withMessage('是否公开必须是一个布尔值'),

  // 检查多余字段
  param().custom((value, { req }) => {
    const allowedFields = ['id']
    const extraFields = Object.keys(req.params).filter((field) => !allowedFields.includes(field))

    if (extraFields.length > 0) {
      throw new Error(`包含多余的字段: ${extraFields.join(', ')}`)
    }

    return true
  }),

  // 检查多余字段
  body().custom((value, { req }) => {
    const allowedFields = [
      'title',
      'description',
      'techStack',
      'demoUrl',
      'githubUrl',
      'giteeUrl',
      'cover',
      'isTop',
      'weight',
      'isPublic',
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
      return res.status(400).json(formatResponse(0, '参数校验失败', errors.array()))
    }
    next()
  },
]

/** 项目删除参数校验中间件 */
const validateProjectDelete = [
  // token校验 必填
  header('Authorization')
    .notEmpty()
    .withMessage('token不能为空')
    .custom(async (token, { req }) => {
      // 普通用户token校验并处理token
      await userAuthorizationUtil(token, req)
    }),

  // 项目ID 必填
  param('id')
    .notEmpty()
    .withMessage('项目ID不能为空')
    .custom(async (value, { req }) => {
      const project = await ProjectModule.findById(value)
      if (!project || project.isDeleted) {
        throw new Error('项目不存在')
      }
      // 用户不是项目创建者
      if (req.user.id !== project.creator.toString()) {
        throw new Error('无权删除该图集')
      }
      return true
    }),

  // 检查多余字段
  param().custom((value, { req }) => {
    const allowedFields = ['id']
    const extraFields = Object.keys(req.params).filter((field) => !allowedFields.includes(field))

    if (extraFields.length > 0) {
      throw new Error(`包含多余的字段: ${extraFields.join(', ')}`)
    }

    return true
  }),

  // 检查所有校验结果
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json(formatResponse(0, '参数校验失败', errors.array()))
    }
    next()
  },
]

/** 项目列表查询参数校验中间件 */
const validateProjectList = [
  // token校验 可选
  header('Authorization')
    .optional()
    .custom(async (token, { req }) => {
      // 普通用户token校验并处理token
      await userAuthorizationUtil(token, req)
    }),

  // 用户id 必填
  param('id')
    .notEmpty()
    .withMessage('用户id不能为空')
    .isMongoId()
    .withMessage('用户ID格式不正确')
    .custom(async (value, { req }) => {
      const user = await UserModule.findById(value)

      if (!(user && !user.isDeleted)) {
        throw new Error('用户不存在')
      }
      return true
    }),

  // 标题模糊查询 可选
  query('title').optional().isLength({ max: 50 }).withMessage('标题长度不能超过50个字符').escape(),

  // 技术栈标签 可选 数组
  query('techStack')
    .optional()
    .isArray()
    .withMessage('技术栈必须是一个数组')
    .custom((value) => {
      if (value.length > 10) {
        throw new Error('技术栈标签数量不能超过10个')
      }
      const tagRegex = /^[a-zA-Z0-9\u4e00-\u9fa5]+$/
      for (const tag of value) {
        if (!tagRegex.test(tag)) {
          throw new Error('技术栈标签只能包含字母、数字、中文')
        }
      }
      return true
    }),

  // 是否公开 可选 布尔值
  query('isPublic').optional().isBoolean().withMessage('是否公开必须是一个布尔值'),

  // 页码 可选
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是一个正整数'),

  // 页大小 可选
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('页大小必须是一个1-20之间的正整数'),

  // 排序字段 可选
  query('sortField')
    .optional()
    .isIn(['create_time', 'update_time', 'weight'])
    .withMessage('排序字段只能是create_time、update_time或weight'),

  // 排序顺序 可选
  query('sortOrder').optional().isIn([1, -1]).withMessage('排序顺序只能是1(升序)或-1(降序)'),

  // 检查多余字段
  param().custom((value, { req }) => {
    const allowedFields = ['id']
    const extraFields = Object.keys(req.params).filter((field) => !allowedFields.includes(field))

    if (extraFields.length > 0) {
      throw new Error(`包含多余的字段: ${extraFields.join(', ')}`)
    }

    return true
  }),

  // 检查多余字段
  query().custom((value, { req }) => {
    const allowedFields = [
      'title',
      'techStack',
      'isPublic',
      'page',
      'pageSize',
      'sortField',
      'sortOrder',
    ]
    const extraFields = Object.keys(req.query).filter((field) => !allowedFields.includes(field))
    if (extraFields.length > 0) {
      throw new Error(`包含多余的字段: ${extraFields.join(', ')}`)
    }
    return true
  }),

  // 检查所有校验结果
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json(formatResponse(0, '参数校验失败', errors.array()))
    }
    next()
  },
]

module.exports = {
  validateProjectCreate,
  validateProjectDetail,
  validateProjectUpdate,
  validateProjectDelete,
  validateProjectList,
}
