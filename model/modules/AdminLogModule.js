const { Schema, model } = require('mongoose')

// 日志模型的schema
const adminLogSchema = new Schema(
  {
    /** 管理员ID */
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'admins',
      required: [true, '管理员ID不能为空'],
      index: true,
    },

    /** 操作类型 */
    type: {
      type: String,
      enum: ['create', 'read', 'update', 'delete'],
      required: [true, '操作类型不能为空'],
    },

    /** 操作内容 */
    content: {
      type: String,
      trim: true,
      maxlength: 500,
      required: [true, '操作内容不能为空'],
    },

    /** 操作时间 */
    time: {
      type: Date,
      default: Date.now,
      index: true,
    },

    /** 操作IP地址 */
    IP: {
      type: String,
      trim: true,
      maxlength: 50,
      required: [true, '操作IP地址不能为空'],
    },
  },
  {
    // 禁用 __v 版本字段
    versionKey: false,
    // 文档在查询JSON对象时，将返回的字段中包含虚拟字段
    toJSON: {
      virtuals: true,
    },
  }
)

adminLogSchema.index({ adminId: 1, Time: -1 }, { unique: true })

const AdminLogModule = model('adminlogs', adminLogSchema)

module.exports = AdminLogModule
