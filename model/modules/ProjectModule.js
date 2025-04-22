const { Schema, model } = require('mongoose')

const projectSchema = new Schema(
  {
    /** 项目创建者 */
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: [true, '项目创建者不能为空'],
    },
    /** 项目名称（必填，展示标题） */
    title: { type: String, required: [true, '项目名称不能为空'], maxlength: 50, trim: true },
    /** 项目描述（必填） */
    description: { type: String, default: '', maxlength: 100, trim: true },
    /** 技术栈标签（如["Vue3","Node.js"]） */
    techStack: {
      type: [
        {
          type: String,
          maxlength: 15,
        },
      ],
      default: [],
    },
    // 需要手动校验地址是否有效
    /** 在线演示地址（可选） */
    demoUrl: { type: String },
    /** GitHub仓库地址（可选） */
    githubUrl: { type: String },
    /** gitee仓库地址（可选） */
    giteeUrl: { type: String },
    /** 封面图 */
    cover: {
      type: Schema.Types.ObjectId,
      ref: 'photos',
    },
    /** 是否置顶展示（手动控制） */
    isFeatured: { type: Boolean, default: false },
    /** 项目权重（数字越大排序越靠前） */
    weight: { type: Number, default: 0 },

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
        const {
          _id,
          creator,
          title,
          description,
          cover,
          techStack,
          demoUrl,
          githubUrl,
          giteeUrl,
          isFeatured,
          weight,
          isPublic,
        } = ret
        return {
          id: _id.toString(),
          creator: creator.toString(),
          title,
          description,
          cover: cover ? cover.toString() : null,
          techStack,
          demoUrl,
          githubUrl,
          giteeUrl,
          isFeatured,
          weight,
          isPublic,
        }
      },
    },
  }
)

// 建立组合搜索索引，加速查询
projectSchema.index({ creator: 1 })
projectSchema.index({ creator: 1, isPublic: 1 })
projectSchema.index({ creator: 1, isPublic: 1, create_time: -1 })

const ProjectModule = model('projects', projectSchema)

module.exports = ProjectModule
