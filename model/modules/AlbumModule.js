const { Schema, model } = require('mongoose')

/**
 * 图片集模型
 * - 用于组织管理多张相关图片
 */
const albumSchema = new Schema(
  {
    /** 图集创建者 */
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: [true, '项目创建者不能为空'],
    },

    /** 图集标题 */
    title: {
      type: String,
      required: [true, '图集标题不能为空'],
      maxlength: 50,
      trim: true,
    },

    /** 图集描述（支持Markdown格式） */
    description: {
      type: String,
      default: '',
      maxlength: 500,
      trim: true,
    },

    /** 封面图片引用 - 必须属于本图集中的图片 */
    coverPhoto: {
      type: Schema.Types.ObjectId,
      ref: 'photos',
      required: [true, '封面图片不能为空'],
    },

    /** 关联的图片列表（按上传顺序排列） */
    photos: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'photos',
        },
      ],
      required: [true, '至少需要一张图片'], // 确保photos数组不能为空
    },

    /** 图集标签 */
    tags: [
      {
        type: String,
        maxlength: 6,
      },
    ],

    /** 删除状态 */
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    // 文档在创建时自动将create_time和update_time字段设置为当前时间，文档更新时自动更新update_time字段
    timestamps: { createdAt: 'create_time', updatedAt: 'update_time' },
    // 禁用 __v 版本字段
    versionKey: false,
    // 文档在查询普通对象时，将返回的字段中包含虚拟字段
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        // 如果文档已模拟删除，则不返回任何字段
        if (ret.isDeleted) {
          return null
        }
        // 显式将_id转换为id字段
        ret.id = ret._id.toString()
        // 可选：删除 _id（根据需求）
        delete ret._id
        return ret
      },
    },
    // 文档在查询JSON对象时，将返回的字段中包含虚拟字段
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        if (ret.isDeleted) {
          return null
        }
        ret.id = ret._id.toString()
        delete ret._id
        return ret
      },
    },
  }
)

// 建立组合搜索索引，加速查询
albumSchema.index({ creator: 1, create_time: -1 }, { unique: true })

// 使用pre中间件在保存数据前进行验证
albumSchema.pre('save', async function (next) {
  // 检查当前文档是否是新创建的，或者photos字段是否被修改过

  // 检查photos数组的长度是否超过200
  if (this.photos.length > 200) {
    return next(new Error('单个图集最多包含200张图片'))
  }

  if (this.isNew || this.isModified('photos')) {
    // 确保photos数组不为空
    if (this.photos.length === 0) {
      return next(new Error('至少需要一张图片'))
    }

    // 将photos数组中的每个photo对象的_id转换为字符串，以便进行比较
    const photoIds = this.photos.map((photo) => photo.toString())

    // 如果封面图片没有选择，则默认为photos数组中的第一个图片
    if (!this.coverPhoto) {
      this.coverPhoto = this.photos[0]
    }

    // 检查coverPhoto是否在photos数组中
    if (!photoIds.includes(this.coverPhoto.toString())) {
      // 如果封面图片不在图集中的图片数组中，抛出一个错误
      return next(new Error('封面图片必须属于图集中的图片'))
    }
  }

  // 如果验证通过，调用next()继续执行保存操作
  next()
})

const AlbumModule = model('albums', albumSchema)

module.exports = AlbumModule
