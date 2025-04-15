const { Schema, model } = require('mongoose')

/** 单张图片模型 */
const photoSchema = new Schema(
  {
    /** 图片上传者 */
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: [true, '图片上传者不能为空'],
    },

    /** 文件名 */
    filename: {
      type: String,
      required: [true, '文件名不能为空'],
      unique: true,
    },

    /** 图片链接，压缩参数省略 */
    url: {
      type: String,
      required: [true, '图片链接不能为空'],
    },

    /** 所属图集（可为空，表示未归类图片） */
    album: {
      type: Schema.Types.ObjectId,
      ref: 'albums',
    },

    /** 删除状态 */
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    // 文档在创建时自动将create_time和update_time字段设置为当前时间，文档更新时自动更新update_time字段
    timestamps: { createdAt: 'create_time', updatedAt: 'update_time' }, // 文档在查询普通对象时，将返回的字段中包含虚拟字段
    versionKey: false, // 禁用 __v 版本字段
    toObject: {
      virtuals: true, // 包含虚拟字段
      transform: (doc, ret) => {
        // 如果文档已模拟删除，则不返回任何字段
        if (ret.isDeleted) {
          return null
        }
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

photoSchema.index({ filename: 1, create_time: 1 }, { unique: true }) // 建立索引

const PhotoModule = model('photos', photoSchema)

module.exports = PhotoModule
