const { body, validationResult, header, param, query } = require('express-validator')
const { DocModule, ProjectModule, AdminModule, UserModule } = require('../../model')
const { formatResponse, verification } = require('../../utils')

/** 文档创建参数校验中间件 */
const validateDocCreate = [
  // token校验 必填
  header('Authorization')
    .notEmpty()
    .withMessage('token不能为空')
    .custom(async (token, { req }) => {
      const decoded = await verification(token)
      req.user = decoded
      if (!decoded) {
        throw new Error('token失效')
      }
    }),

  // 文档标题 必填 长度限制 防XSS
  body('title')
    .notEmpty()
    .withMessage('文档标题不能为空')
    .isLength({ min: 1, max: 50 })
    .withMessage('文档标题长度必须在1-50个字符之间')
    .escape(),

  // 文档内容 必填
  body('content').notEmpty().withMessage('文档内容不能为空'),

  // 分类目录 必填 枚举值
  body('category')
    .notEmpty()
    .withMessage('分类目录不能为空')
    .isIn(['技术', '随笔', '生活', '动漫', '六花', '其他'])
    .withMessage('分类目录必须是有效的值'),

  // 标签 可选 数组
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是一个数组')
    .custom((value) => {
      if (value.length > 10) {
        throw new Error('标签数量不能超过10个')
      }
      const tagRegex = /^[a-zA-Z0-9\u4e00-\u9fa5]+$/
      for (const tag of value) {
        if (!tagRegex.test(tag)) {
          throw new Error('标签只能包含字母、数字、中文')
        }
        if (tag.length > 15) {
          throw new Error('标签长度不能超过15个字符')
        }
      }
      return true
    }),

  // 关联项目 可选 ObjectId
  body('relatedProject')
    .optional()
    .isMongoId()
    .withMessage('关联项目ID格式不正确')
    .custom(async (value) => {
      const project = await ProjectModule.findById(value)
      if (!project || project.isDeleted) {
        throw new Error('关联项目不存在')
      }
      return true
    }),

  // 是否公开 必填 布尔值
  body('isPublic')
    .notEmpty()
    .withMessage('是否公开不能为空')
    .isBoolean()
    .withMessage('是否公开必须是一个布尔值'),

  // 检查多余字段
  body().custom((value, { req }) => {
    const allowedFields = ['title', 'content', 'category', 'tags', 'relatedProject', 'isPublic']
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

/** 文档更新参数校验中间件 */
const validateDocUpdate = [
  // token校验 必填
  header('Authorization')
    .notEmpty()
    .withMessage('token不能为空')
    .custom(async (token, { req }) => {
      const decoded = await verification(token)
      req.user = decoded
      if (!decoded) {
        throw new Error('token失效')
      }
    }),

  // 文档ID 必填
  param('id')
    .notEmpty()
    .withMessage('文档ID不能为空')
    .custom(async (value, { req }) => {
      const doc = await DocModule.findById(value)
      if (!doc || doc.isDeleted) {
        throw new Error('文档不存在')
      }
      if (doc.creator.toString() !== req.user.id) {
        throw new Error('无权修改该文档')
      }
      return true
    }),

  // 文档标题 可选 长度限制 防XSS
  body('title')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('文档标题长度必须在1-50个字符之间')
    .escape(),

  // 文档内容 可选
  body('content').optional().notEmpty().withMessage('文档内容不能为空'),

  // 分类目录 可选 枚举值
  body('category')
    .optional()
    .isIn(['技术', '随笔', '生活', '动漫', '六花', '其他'])
    .withMessage('分类目录必须是有效的值'),

  // 标签 可选 数组
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是一个数组')
    .custom((value) => {
      if (value.length > 10) {
        throw new Error('标签数量不能超过10个')
      }
      const tagRegex = /^[a-zA-Z0-9\u4e00-\u9fa5]+$/
      for (const tag of value) {
        if (!tagRegex.test(tag)) {
          throw new Error('标签只能包含字母、数字、中文')
        }
        if (tag.length > 15) {
          throw new Error('标签长度不能超过15个字符')
        }
      }
      return true
    }),

  // 关联项目 可选 ObjectId
  body('relatedProject')
    .optional()
    .isMongoId()
    .withMessage('关联项目ID格式不正确')
    .custom(async (value) => {
      const project = await ProjectModule.findById(value)
      if (!project || project.isDeleted) {
        throw new Error('关联项目不存在')
      }
      return true
    }),

  // 是否公开 可选 布尔值
  body('isPublic').optional().isBoolean().withMessage('是否公开必须是一个布尔值'),

  // 检查多余字段
  body().custom((value, { req }) => {
    const allowedFields = ['title', 'content', 'category', 'tags', 'relatedProject', 'isPublic']
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

/** 文档删除参数校验中间件 */
const validateDocDelete = [
  // token校验 必填
  header('Authorization')
    .notEmpty()
    .withMessage('token不能为空')
    .custom(async (token, { req }) => {
      const decoded = await verification(token)
      req.user = decoded
      if (!decoded) {
        throw new Error('token失效')
      }
    }),

  // 文档ID 必填
  param('id')
    .notEmpty()
    .withMessage('文档ID不能为空')
    .custom(async (value, { req }) => {
      const doc = await DocModule.findById(value)
      if (!doc || doc.isDeleted) {
        throw new Error('文档不存在')
      }
      // 如果是管理员，允许删除
      if (doc.creator.toString() !== req.user.id) {
        const admin = await AdminModule.findById(req.user.id)
        if (!admin) {
          throw new Error('无权删除该文档')
        }
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

/** 文档列表查询参数校验中间件 */
const validateDocList = [
  // token校验 可选
  header('Authorization')
    .optional()
    .custom(async (token, { req }) => {
      const decoded = await verification(token)
      req.user = decoded
      return true
    }),

  // 标题模糊查询 可选
  query('title').optional().isLength({ max: 50 }).withMessage('标题长度不能超过50个字符').escape(),

  // 分类目录 可选
  query('category')
    .optional()
    .isIn(['技术', '随笔', '生活', '动漫', '六花', '其他'])
    .withMessage('分类目录必须是有效的值'),

  // 标签 可选 数组
  query('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是一个数组')
    .custom((value) => {
      if (value.length > 10) {
        throw new Error('标签数量不能超过10个')
      }
      const tagRegex = /^[a-zA-Z0-9\u4e00-\u9fa5]+$/
      for (const tag of value) {
        if (!tagRegex.test(tag)) {
          throw new Error('标签只能包含字母、数字、中文')
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
    .isIn(['create_time', 'update_time', 'editTimes'])
    .withMessage('排序字段只能是create_time、update_time或editTimes'),

  // 排序顺序 可选
  query('sortOrder').optional().isIn([1, -1]).withMessage('排序顺序只能是1(升序)或-1(降序)'),

  // 检查多余字段
  query().custom((value, { req }) => {
    const allowedFields = [
      'title',
      'category',
      'tags',
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
  validateDocCreate,
  validateDocUpdate,
  validateDocDelete,
  validateDocList,
}
