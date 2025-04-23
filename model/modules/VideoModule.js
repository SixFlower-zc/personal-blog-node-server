const { Schema, model } = require('mongoose')

/** 视频模型 */
const videoSchema = new Schema(
  {
    /** 视频上传者 */
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'users',
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
      default: true,
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

        const { _id, creator = '', filename, url, metadata, album = '', isPublic } = ret

        return {
          id: _id.toString(),
          creator: creator.toString(),
          filename,
          url,
          album: album.toString(),
          metadata: {
            format: metadata.format,
            size: metadata.size,
          },
          isPublic,
        }
      },
    },
  }
)

// 建立组合搜索索引，加速查询
videoSchema.index({ album: 1 })
videoSchema.index({ creator: 1 })
videoSchema.index({ creator: 1, isPublic: 1 })
videoSchema.index({ creator: 1, create_time: -1 })
videoSchema.index({ creator: 1, create_time: -1, isPublic: 1 })

const VideoModule = model('videos', videoSchema)

module.exports = VideoModule
