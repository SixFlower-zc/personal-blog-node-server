const { Schema, model } = require('mongoose')

const docSchema = new Schema(
  {
    /** 文章创建者 */
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: [true, '项目创建者不能为空'],
    },

    /** 文章标题 */
    title: {
      type: String,
      required: [true, '文章标题不能为空'],
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

    /** 关联项目（可选，与项目墙关联） */
    relatedProject: { type: Schema.Types.ObjectId, ref: 'projects' },

    /** 访问量 */
    views: {
      type: Number,
      default: 0,
    },

    /** 访问者列表 */
    visitors: [
      {
        type: Schema.Types.ObjectId,
        ref: 'users',
      },
    ],

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
    // 文章在创建时自动将create_time和update_time字段设置为当前时间，文章更新时自动更新update_time字段
    timestamps: { createdAt: 'create_time', updatedAt: 'update_time' }, // 文章在查询普通对象时，将返回的字段中包含虚拟字段
    versionKey: false, // 禁用 __v 版本字段
    // 文章在查询json对象时，将返回的字段中包含虚拟字段
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        if (ret.isDeleted) {
          return null
        }

        const {
          _id,
          creator,
          title,
          content,
          category,
          tags,
          editTimes,
          relatedProject,
          isPublic,
          views,
          visitors,
          create_time,
        } = ret

        return {
          id: _id.toString(),
          creator: creator.toString(),
          title,
          content,
          category,
          tags,
          editTimes,
          relatedProject: relatedProject ? relatedProject.toString() : null,
          isPublic,
          views,
          visitors,
          create_time,
        }
      },
    },
  }
)

// 建立组合搜索索引，加速查询
docSchema.index({ creator: 1 })
docSchema.index({ creator: 1, category: 1 })
docSchema.index({ creator: 1, create_time: 1 })
docSchema.index({ creator: 1, category: 1, relatedProject: 1 })
docSchema.index({ creator: 1, category: 1, isPublic: 1 })

const DocModule = model('docs', docSchema)

module.exports = DocModule
