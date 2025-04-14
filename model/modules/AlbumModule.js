const { Schema, model } = require('mongoose')

/**
 * 图片集模型
 * - 用于组织管理多张相关图片
 */
const albumSchema = new Schema(
  {
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

    /**
     * 封面图片引用
     * - 必须属于本图集中的图片
     */
    coverPhoto: {
      type: Schema.Types.ObjectId,
      ref: 'Photo',
      required: true,
      validate: {
        validator: async function (v) {
          const photo = await model('Photo').findById(v)
          return photo && photo.album.equals(this._id)
        },
        message: '封面图片必须属于本图集',
      },
    },

    /** 关联的图片列表（按上传顺序排列） */
    photos: [
      {
        type: Schema.Types.ObjectId,
        ref: 'photos',
        validate: {
          validator: (v) => v.length <= 200,
          message: '单个图集最多包含200张图片',
        },
      },
    ],

    /** 图集标签 */
    tags: [
      {
        type: String,
        maxlength: 6,
      },
    ],
  },
  {
    // 文档在创建时自动将create_time和update_time字段设置为当前时间，文档更新时自动更新update_time字段
    timestamps: { createdAt: 'create_time', updatedAt: 'update_time' }, // 文档在查询普通对象时，将返回的字段中包含虚拟字段
    toObject: {
      virtuals: true, // 包含虚拟字段
      transform: (doc, ret) => {
        // 显式将_id转换为id字段
        ret.id = ret._id.toString() // 显式添加 id 字段
        delete ret._id // 可选：删除 _id（根据需求）
        return ret
      },
    },
    // 文档在查询json对象时，将返回的字段中包含虚拟字段
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString()
        delete ret._id
        return ret
      },
    },
  }
)

const AlbumModule = model('albums', albumSchema)

module.exports = AlbumModule
