const { Schema, model } = require('mongoose')
const { role } = require('../../config/adminConfig')
const { base_url } = require('../../config/appConfig')

// 管理员模型的schema
const adminSchema = new Schema(
  {
    /** 管理员专属ID */
    aid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    /** 密码 */
    password: {
      type: String,
      required: [true, '密码不能为空'],
      trim: true,
    },

    /** 头像 */
    avatar: {
      type: String,
      trim: true,
      default: `${base_url}/images/original-default_avatar.png`,
    },

    /** 昵称 */
    nickname: {
      type: String,
      trim: true,
      maxlength: 10,
      required: [true, '昵称不能为空'],
    },

    /** 邮箱 */
    email: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
      index: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(($[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$)|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        '邮箱格式不正确',
      ],
    },

    /** 权限等级 */
    role: {
      type: Number,
      enum: role.map((item) => item.value),
      default: role[0].value,
    },

    /** 权限路由 */
    routes: {
      type: Array,
      default: [],
    },

    /** 管理员状态 */
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },

    /** 操作日志 */
    logs: [
      {
        type: Schema.Types.ObjectId,
        ref: 'adminlogs',
      },
    ],

    /** 最后登录时间 */
    lastLoginTime: Date,

    /** 最后登录IP地址 */
    lastLoginIP: {
      type: String,
      trim: true,
      maxlength: 50,
    },

    /** 是否已删除 */
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
    timestamps: { createdAt: 'create_time', updatedAt: 'update_time' },
    // 禁用 __v 版本字段
    versionKey: false,
    // 文档在查询JSON对象时，将返回的字段中包含虚拟字段
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        if (ret.isDeleted) {
          return null
        }
        ret.id = ret._id.toString()
        delete ret._id
        delete ret.password
        return ret
      },
    },
  }
)

// 每次保存管理员认证信息时，生成aid
adminSchema.pre('save', async function (next) {
  // 如果当前文档是新创建的
  if (this.isNew) {
    // 定义计数器的名称，这里假设为'adminIdCounter'
    const counterName = 'adminIdCounter'

    // 从数据库中查找或创建一个名为'adminIdCounter'的计数器文档，并将seq字段自增1
    const counter = await CounterModel.findOneAndUpdate(
      { name: counterName },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    )

    // 将自增后的seq值转换为字符串，并确保其长度为6位，不足6位时前面补零
    this.aid = counter.seq.toString().padStart(6, '0')

    // 调用next()继续执行保存操作
  }
  // 根据权限等级，自动设置权限路由
  this.routes = role.find((item) => item.value === this.role).routes
  next()
})

const AdminModule = model('admins', adminSchema)

module.exports = AdminModule
