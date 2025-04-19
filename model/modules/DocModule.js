const { Schema, model } = require('mongoose')

const docSchema = new Schema(
  {
    /** 文档创建者 */
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: [true, '项目创建者不能为空'],
    },

    /** 文档标题 */
    title: {
      type: String,
      required: [true, '文档标题不能为空'],
      maxlength: 50,
    },

    /** Markdown原始内容（支持代码块） */
    content: { type: String, required: true, default: '' },

    /** 分类目录（如"技术笔记"/"生活随笔"） */
    category: {
      type: String,
      enum: ['技术', '随笔', '生活', '动漫', '六花', '其他'],
      default: '其他',
    },

    /** 标签（可选） */
    tags: {
      type: [
        {
          type: String,
          maxlength: 15,
        },
      ],
      default: [],
    },

    /** 更改次数 */
    editTimes: { type: Number, default: 0 },

    /** 关联项目（可选，与项目墙关联） */
    relatedProject: { type: Schema.Types.ObjectId, ref: 'projects' },

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
        return ret
      },
    },
  }
)

// 建立组合搜索索引，加速查询
docSchema.index({ creator: 1, category: 1, create_time: -1 }, { unique: true })

const DocModule = model('docs', docSchema)

module.exports = DocModule
