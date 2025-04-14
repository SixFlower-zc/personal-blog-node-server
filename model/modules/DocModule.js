const { Schema, model } = require('mongoose')

const docSchema = new Schema(
  {
    /** 文档标题（唯一性约束） */
    title: {
      type: String,
      required: true,
      unique: true,
      maxlength: 100,
    },

    /** Markdown原始内容（支持代码块） */
    content: { type: String, required: true, default: '' },

    /** 分类目录（如"技术笔记"/"生活随笔"） */
    category: {
      type: String,
      enum: ['技术', '随笔', '生活', '动漫', '六花', '其他'],
      default: '其他',
    },

    /** 更改次数 */
    editTimes: { type: Number, default: 0 },

    /** 关联项目（可选，与项目墙关联） */
    relatedProject: { type: Schema.Types.ObjectId, ref: 'projects' },
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

const DocModule = model('docs', docSchema)

module.exports = DocModule
