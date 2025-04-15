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
    /** 在线演示地址（可选） */
    demoUrl: { type: String, validate: isURL },
    /** GitHub仓库地址（可选） */
    githubUrl: { type: String, validate: isURL },
    /** gitee仓库地址（可选） */
    giteeUrl: { type: String, validate: isURL },
    /** 封面图 */
    coverImage: {
      type: Schema.Types.ObjectId,
      ref: 'photos',
      required: [true, '封面图不能为空'],
    },
    /** 是否置顶展示（手动控制） */
    isFeatured: { type: Boolean, default: false },
    /** 项目权重（数字越大排序越靠前） */
    weight: { type: Number, default: 0 },

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

// 建立索引
projectSchema.index({ title: 1, weight: -1, create_time: -1 }, { unique: true })

const ProjectModule = model('projects', projectSchema)

module.exports = ProjectModule
