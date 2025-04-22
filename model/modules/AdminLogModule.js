const mongoose = require('mongoose')

const adminLogSchema = new mongoose.Schema(
  {
    // 操作管理员ID
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    // 操作类型
    type: {
      type: String,
      enum: [
        'LOGIN', // 登录
        'LOGOUT', // 登出
        'CREATE_ADMIN', // 创建管理员
        'UPDATE_ADMIN', // 更新管理员
        'DELETE_ADMIN', // 删除管理员
        'UPDATE_PROFILE', // 更新个人信息
        'CHANGE_PASSWORD', // 修改密码
        'OPERATE_NORMAL_USER', // 操作普通用户
        'OTHER', // 其他操作
      ],
      required: true,
    },
    // 操作详情
    detail: {
      type: Object,
      default: {},
    },
    // 操作IP
    ip: {
      type: String,
      required: true,
    },
    // 操作时间
    create_time: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: 'create_time', updatedAt: 'update_time' },
    // 禁用 __v 版本字段
    versionKey: false,
    // 文档在查询JSON对象时，将返回的字段中包含虚拟字段
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        const { _id, type, detail, create_time } = ret

        return {
          id: _id.toString(),
          type,
          detail,
          create_time,
        }
      },
    },
  }
)

// 建立组合搜索索引，加速查询
adminLogSchema.index({ adminId: 1 })
adminLogSchema.index({ adminId: 1, create_time: -1 })
adminLogSchema.index({ adminId: 1, create_time: -1, type: 1 })

const AdminLogModule = mongoose.model('AdminLog', adminLogSchema)

module.exports = AdminLogModule
