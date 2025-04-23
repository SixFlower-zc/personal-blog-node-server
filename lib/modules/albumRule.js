const { body, validationResult, header, param, query } = require('express-validator')
const { AlbumModule, VideoModule, PhotoModule, AdminModule, UserModule } = require('../../model')
const { formatResponse, verification } = require('../../utils')
const { userAuthorizationUtil } = require('../authorizationUtil')

/** 图集创建参数校验中间件 */
const validateAlbumCreate = [
  // token校验 必填
  header('Authorization')
    .notEmpty()
    .withMessage('token不能为空')
    .custom(async (token, { req }) => {
      // 普通用户token校验并处理token
      await userAuthorizationUtil(token, req)
    }),

  // 图集标题 必填 长度限制 防XSS
  body('title')
    .notEmpty()
    .withMessage('图集标题不能为空')
    .isLength({ min: 1, max: 20 })
    .withMessage('图集标题长度必须在1-20个字符之间')
    .escape(), // 清理：转义HTML特殊字符（防XSS）

  // 图集描述 非必填 长度限制 防XSS
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('图集描述长度不能超过200个字符')
    .escape(), // 清理：转义HTML特殊字符（防XSS）

  // 图集封面 可选 必须是一个数字索引 只能是图片数组的索引
  body('cover')
    .optional() // 可选参数
    .isInt({ min: 0 })
    .withMessage('图集封面必须是一个数字索引')
    .custom(async (value, { req }) => {
      if (value >= req.body.photos.length) {
        throw new Error('图集封面必须是上传的图片数据的索引')
      }
    }),

  // 图片数组 可选 数组内存的是photo的id
  body('photos')
    .optional() // 可选参数
    .isArray()
    .withMessage('图片数组必须是一个数组')
    .custom(async (value, { req }) => {
      if (value.length > 9) {
        throw new Error('图片数组长度不能超过9')
      }
      // 如果videos数组不存在，则图片数组必须存在
      if (!req.body.videos) {
        if (value.length === 0) {
          throw new Error('图片数组不能为空')
        }
      }
      // 检查数组中的图片id能否在数据库中查询到
      for (const photoId of value) {
        const photo = await PhotoModule.findById(photoId)
        if (!photo) {
          throw new Error(`图片id ${photoId} 不存在`)
        }
      }
      return true
    }),

  // 视频数组 可选 数组内存的是video的id
  body('videos')
    .optional() // 可选参数
    .isArray()
    .withMessage('视频数组必须是一个数组')
    .custom(async (value, { req }) => {
      if (value.length > 4) {
        throw new Error('视频数组长度不能超过4')
      }

      // 检查数组中的视频id能否在数据库中查询到
      for (const videoId of value) {
        const video = await VideoModule.findById(videoId)
        if (!video) {
          throw new Error(`视频id ${videoId} 不存在`)
        }
      }

      return true
    }),

  // 图集标签 必填 字符串数组 标签长度限制 标签字符限制
  body('tags')
    .notEmpty()
    .withMessage('图集标签不能为空')
    .isArray()
    .withMessage('图集标签必须是一个字符串数组')
    .custom((value) => {
      if (value.length > 10) {
        throw new Error('图集标签长度不能超过10')
      }
      return true
    })
    .custom((value) => {
      const tagRegex = /^[a-zA-Z0-9\u4e00-\u9fa5]+$/
      for (const tag of value) {
        if (!tagRegex.test(tag)) {
          throw new Error('图集标签只能包含字母、数字、中文')
        }
      }
      return true
    }),

  // 公开状态 必填 布尔值
  body('isPublic')
    .notEmpty()
    .withMessage('公开状态不能为空')
    .isBoolean()
    .withMessage('公开状态必须是一个布尔值'),

  // 检查多余字段
  body().custom((value, { req }) => {
    const allowedFields = ['title', 'description', 'cover', 'photos', 'videos', 'tags', 'isPublic']
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

/** 图集信息更新参数校验中间件 */
const validateAlbumUpdate = [
  // token校验 必填
  header('Authorization')
    .notEmpty()
    .withMessage('token不能为空')
    .custom(async (token, { req }) => {
      // 普通用户token校验并处理token
      await userAuthorizationUtil(token, req)
    }),

  // 图集id 必填
  param('id')
    .notEmpty()
    .withMessage('图集id不能为空')
    .isMongoId()
    .withMessage('图集ID格式不正确')
    .custom(async (value, { req }) => {
      const album = await AlbumModule.findById(value)
      if (!(album && !album.isDeleted)) {
        throw new Error('图集不存在')
      }
      // 只有图集的创建者修改图集信息
      if (album.creator.toString() !== req.user.id) {
        throw new Error('无权修改该图集信息')
      }
      return true
    }),

  // 图集标题 可选 长度限制 防XSS
  body('title')
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage('图集标题长度必须在1-20个字符之间')
    .escape(), // 清理：转义HTML特殊字符（防XSS）

  // 图集描述 可选 长度限制 防XSS
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('图集描述长度不能超过200个字符')
    .escape(), // 清理：转义HTML特殊字符（防XSS）

  // 图集封面 可选 必须是一个数字索引 只能是图片数组的索引
  body('cover')
    .optional() // 可选参数
    .isInt({ min: 0 })
    .withMessage('图集封面必须是一个数字索引')
    .custom(async (value, { req }) => {
      // 如果图片修改，则必须从上传的数组中选择
      const { photos } = req.body
      const { id } = req.params

      // 如果图片修改，则封面必须是上传的图片数据的索引

      if (photos && value >= photos.length) {
        throw new Error('图集封面必须是上传的图片数据的索引')
      }

      // 如果图片未修改，则需获取原图集的图片数组来选择
      const album = await AlbumModule.findById(id)

      if (!album.photos) {
        throw new Error('请先上传图片再选择封面')
      }

      if (value >= album.photos.length) {
        throw new Error('图集封面必须是上传的图片数据的索引')
      }

      return true
    }),

  // 图片数组 可选 数组内存的是photo的id
  body('photos')
    .optional() // 可选参数
    .isArray()
    .withMessage('图片数组必须是一个数组')
    .custom(async (value, { req }) => {
      if (value.length > 9) {
        throw new Error('图片数组长度不能超过9')
      }
      // 如果videos数组不存在，则图片数组必须存在
      if (!req.body.videos) {
        if (value.length === 0) {
          throw new Error('图片数组不能为空')
        }
      }
      // 检查数组中的图片id能否在数据库中查询到
      for (const photoId of value) {
        const photo = await PhotoModule.findById(photoId)
        if (!photo) {
          throw new Error(`图片id ${photoId} 不存在`)
        }
        // 检查图片所有者
        if (photo.creator !== req.user.id) {
          throw new Error('无权将该图片添加到图集')
        }
      }
      return true
    }),

  // 视频数组 可选 数组内存的是video的id
  body('videos')
    .optional() // 可选参数
    .isArray()
    .withMessage('视频数组必须是一个数组')
    .custom(async (value, { req }) => {
      if (value.length > 4) {
        throw new Error('视频数组长度不能超过4')
      }

      // 检查数组中的视频id能否在数据库中查询到
      for (const videoId of value) {
        const video = await VideoModule.findById(videoId)
        if (!video) {
          throw new Error(`视频id ${videoId} 不存在`)
        }
      }

      return true
    }),

  // 图集标签 可选 字符串数组 标签长度限制 标签字符限制
  body('tags')
    .optional()
    .isArray()
    .withMessage('图集标签必须是一个字符串数组')
    .custom((value) => {
      if (value.length > 10) {
        throw new Error('图集标签长度不能超过10')
      }
      return true
    })
    .custom((value) => {
      const tagRegex = /^[a-zA-Z0-9\u4e00-\u9fa5]+$/
      for (const tag of value) {
        if (!tagRegex.test(tag)) {
          throw new Error('图集标签只能包含字母、数字、中文')
        }
      }
      return true
    }),

  // 公开状态 可选 布尔值
  body('isPublic').optional().isBoolean().withMessage('公开状态必须是一个布尔值'),

  // 检查多余字段
  body().custom((value, { req }) => {
    const allowedFields = [
      'id',
      'title',
      'description',
      'cover',
      'photos',
      'videos',
      'tags',
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
      return res.status(400).json(formatResponse(0, '用户信息更新失败-参数错误', errors.array()))
    }
    next()
  },
]

/** 查看图集详情参数校验中间件 */
const validateGetAlbumDetail = [
  // token校验 可选
  header('Authorization')
    .optional() // 可选参数
    .custom(async (token, { req }) => {
      // 普通用户token校验并处理token
      await userAuthorizationUtil(token, req)
    }),

  // 图集id 必填
  param('id').notEmpty().withMessage('图集id不能为空').isMongoId().withMessage('图集ID格式不正确'),

  // 检查多余字段
  param().custom((value, { req }) => {
    const allowedFields = ['id']
    const extraFields = Object.keys(req.params).filter((field) => !allowedFields.includes(field))

    if (extraFields.length > 0) {
      throw new Error(`包含多余的字段: ${extraFields.join(', ')}`)
    }

    return true
  }),

  query().custom((value, { req }) => {
    const allowedFields = []
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
      return res.status(400).json(formatResponse(0, '用户信息更新失败-参数错误', errors.array()))
    }
    next()
  },
]

/** 图集删除参数校验中间件 */
const validateAlbumDelete = [
  // token校验 必填
  header('Authorization')
    .notEmpty()
    .withMessage('token不能为空')
    .custom(async (token, { req }) => {
      // 普通用户token校验并处理token
      await userAuthorizationUtil(token, req)
    }),

  // 图集id 必填
  param('id')
    .notEmpty()
    .withMessage('图集id不能为空')
    .isMongoId()
    .withMessage('图集ID格式不正确')
    .custom(async (value, { req }) => {
      const album = await AlbumModule.findById(value)
      if (!(album && !album.isDeleted)) {
        throw new Error('图集不存在')
      }
      // 如果操作者不是图集创建者，则需要管理员权限
      if (req.user.id !== album.creator.toString()) {
        const admin = await AdminModule.findById(req.user.id)
        if (admin) {
          return
        }
        throw new Error('无权删除该图集')
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

/** 用户查询指定用户的图集列表参数校验中间件 */
const validateUserAlbumList = [
  // token校验 选填
  header('Authorization')
    .optional() // 可选参数
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
  query('title')
    .optional() // 可选参数
    .isLength({ max: 20 })
    .withMessage('标题长度不能超过20个字符')
    .escape(), // 清理：转义HTML特殊字符（防XSS）

  // 标签模糊查询 数组 可选
  query('tags')
    .optional() // 可选参数
    .isArray()
    .withMessage('标签必须是一个字符串数组')
    .custom((value) => {
      if (value.length > 10) {
        throw new Error('标签长度不能超过10')
      }
      return true
    })
    .custom((value) => {
      const tagRegex = /^[a-zA-Z0-9\u4e00-\u9fa5]+$/
      for (const tag of value) {
        if (!tagRegex.test(tag)) {
          throw new Error('标签只能包含字母、数字、中文')
        }
      }
      return true
    }),

  // 是否公开 布尔值 可选
  query('isPublic')
    .optional() // 可选参数
    .isBoolean()
    .withMessage('是否公开必须是一个布尔值'),

  // 页码 必填
  query('page')
    .optional() // 可选参数
    .isInt({ min: 1 })
    .withMessage('页码必须是一个正整数'),

  // 页大小 必填
  query('pageSize')
    .optional() // 可选参数
    .isInt({ min: 1, max: 10 })
    .withMessage('页大小必须是一个1-10之间的正整数'),

  query('sortField')
    .optional() // 可选参数
    .isIn(['create_time', 'update_time', 'views'])
    .withMessage('排序字段只能是create_time、update_time或views'),

  query('sortOrder')
    .optional() // 可选参数
    .isIn([1, -1])
    .withMessage('排序顺序只能是1(升序)或-1(降序)'),

  // 检查多余字段
  query().custom((value, { req }) => {
    const allowedFields = [
      'creator',
      'title',
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
      return res.status(400).json(formatResponse(0, '用户信息更新失败-参数错误', errors.array()))
    }
    next()
  },
]

module.exports = {
  validateAlbumCreate,
  validateAlbumUpdate,
  validateGetAlbumDetail,
  validateAlbumDelete,
  validateUserAlbumList,
}
