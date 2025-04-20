const { Schema, model } = require('mongoose')

/** 视频模型 */
const videoSchema = new Schema(
  {
    /** 视频上传者 */
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: [true, '视频上传者不能为空'],
    },

    /** 文件名 */
    filename: {
      type: String,
      required: [true, '文件名不能为空'],
      unique: true,
    },

    /** 视频链接 */
    url: {
      type: String,
      required: [true, '视频链接不能为空'],
    },

    /** 所属图集（可为空，表示未归类视频） */
    album: {
      type: Schema.Types.ObjectId,
      ref: 'albums',
    },

    /** 视频元数据 */
    metadata: {
      type: {
        /** 文件格式 */
        format: {
          type: String,
          trim: true,
          maxlength: 50,
        },
        /** 文件大小（字节） */
        size: {
          type: Number,
        },
      },
    },

    /** 公开状态 */
    isPublic: {
      type: Boolean,
      default: false,
    },

    /** 删除状态 */
    isDeleted: {
      type: Boolean,
      default: false,
    },

    /** 创建时间 */
    create_time: Date,

    /** 更新时间 */
    update_time: Date,
  },
  {
    // 文档在创建时自动将create_time和update_time字段设置为当前时间，文档更新时自动更新update_time字段
    timestamps: { createdAt: 'create_time', updatedAt: 'update_time' }, // 文档在查询普通对象时，将返回的字段中包含虚拟字段
    versionKey: false, // 禁用 __v 版本字段
    // 文档在查询json对象时，将返回的字段中包含虚拟字段
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        if (ret.isDeleted) {
          return null
        }
        ret.id = ret._id.toString()
        delete ret._id
        delete ret.isDeleted
        delete ret.create_time
        delete ret.update_time
        delete ret.isPublic

        return ret
      },
    },
  }
)

videoSchema.index({ creator: 1, filename: 1, create_time: 1 }, { unique: true }) // 建立索引

const VideoModule = model('videos', videoSchema)

module.exports = VideoModule
