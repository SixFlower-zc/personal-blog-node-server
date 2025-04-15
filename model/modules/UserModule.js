const { Schema, model } = require('mongoose')
const CounterModel = require('./CounterModel')

// 用户模型的schema
const userSchema = new Schema(
  {
    /** 用户专属ID */
    uid: {
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
      minlength: 10,
    },

    /** 头像 */
    avatar: {
      type: String,
      default: '',
    },

    /** 昵称 */
    nickname: {
      type: String,
      trim: true,
      maxlength: 10,
      required: [true, '昵称不能为空'],
    },

    /** 性别 */
    gender: {
      type: String,
      enum: ['male', 'female', ' hidden'],
      default: 'hidden',
    },

    /** 生日 */
    birthday: {
      type: Date,
      default: new Date(),
    },

    /** 个人简介 */
    bio: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    /** 电话号码 */
    phone: {
      type: String,
      trim: true,
      maxlength: 15,
      unique: true,
      index: true,
      match: [
        /^(?:(?:\+|00)86)?1(?:(?:3[\d])|(?:4[5-79])|(?:5[0-35-9])|(?:6[5-7])|(?:7[0-8])|(?:8[\d])|(?:9[1589]))\d{8}$/,
        '手机号码格式不正确',
      ],
    },

    /** 电子邮件 */
    email: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
      unique: true,
      index: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        '邮箱格式不正确',
      ],
    },

    /** 登录失败计数 */
    failedAttempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },

    /** 状态 */
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },

    /** 注册IP地址 */
    registerIP: {
      type: String,
      trim: true,
      maxlength: 50,
    },

    /** 最后登录IP地址 */
    lastLoginIP: {
      type: String,
      trim: true,
      maxlength: 50,
    },

    /** 最后登录时间 */
    lastLoginTime: Date,

    /** 账户解锁时间 */
    lockUntil: Date,

    /** 账户是否注销 */
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    // 文档在创建时自动将create_time和update_time字段设置为当前时间，文档更新时自动更新update_time字段
    timestamps: { createdAt: 'create_time', updatedAt: 'update_time' },
    // 禁用 __v 版本字段
    versionKey: false,
    // 文档在查询普通对象时，将返回的字段中包含虚拟字段
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        // 如果文档已模拟删除，则不返回任何字段
        if (ret.isDeleted) {
          return null
        }
        // 显式将_id转换为id字段
        ret.id = ret._id.toString()
        // 可选：删除 _id（根据需求）
        delete ret._id
        // 删除密码字段，确保不返回密码
        delete ret.password
        return ret
      },
    },
    // 文档在查询JSON对象时，将返回的字段中包含虚拟字段
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        if (ret.isDeleted) {
          return null
        }
        ret.id = ret._id.toString()
        delete ret._id
        // 删除密码字段，确保不返回密码
        delete ret.password
        return ret
      },
    },
  }
)

// 每次保存用户认证信息时，生成providerId
userSchema.pre('save', async function (next) {
  // 如果当前文档是新创建的
  if (this.isNew) {
    // 定义计数器的名称，这里假设为'providerIdCounter'
    const counterName = 'providerIdCounter'

    // 从数据库中查找或创建一个名为'providerIdCounter'的计数器文档，并将seq字段自增1
    // findOneAndUpdate方法用于查找指定条件的文档并更新它
    const counter = await CounterModel.findOneAndUpdate(
      { name: counterName },
      // $inc 用于自增计数器
      { $inc: { seq: 1 } },
      // { new: true } 表示返回更新后的文档
      // { upsert: true } 表示如果找不到指定条件的文档，则创建一个新的文档
      { new: true, upsert: true }
    )

    // 将自增后的seq值转换为字符串，并确保其长度为6位，不足6位时前面补零
    this.uid = counter.seq.toString().padStart(6, '0')

    // 调用next()继续执行保存操作
  }

  next()
})

const UserModule = model('users', userSchema)

module.exports = UserModule
