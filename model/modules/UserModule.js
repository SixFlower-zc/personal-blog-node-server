const { Schema, model } = require('mongoose')
const CounterModel = require('./CounterModel')
const { base_url } = require('../../config/appConfig')
const { generateNickname } = require('../../utils')

// 用户模型的schema
const userSchema = new Schema(
  {
    /** 用户专属ID */
    uid: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: '000000',
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
      minlength: 1,
      maxlength: 10,
      default: generateNickname(),
    },

    /** 性别 */
    gender: {
      type: String,
      enum: ['male', 'female', 'hidden'],
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
      default: '',
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
      required: [true, '邮箱不能为空'],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
      index: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        '邮箱格式不正确',
      ],
    },

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

    /** 登录失败计数 */
    failedAttempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
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
      required: [true, '注册IP地址不能为空'],
      trim: true,
      maxlength: 50,
    },

    /** 最后登录IP地址 */
    lastLoginIP: {
      type: String,
      trim: true,
      maxlength: 50,
      default: '',
    },

    /** 最后登录时间 */
    lastLoginTime: {
      type: Date,
      default: new Date(),
    },

    /** 账户解锁时间 */
    lockUntil: {
      type: Date,
      default: new Date(),
    },

    /** 账户是否注销 */
    isDeleted: {
      type: Boolean,
      default: false,
    },

    /** 账户危险等级 */
    riskLevel: {
      type: Number,
      default: 0,
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

        // 返回字段
        const {
          _id,
          uid,
          nickname,
          avatar,
          gender,
          birthday,
          bio,
          phone,
          email,
          views,
          visitors = [],
        } = ret

        return {
          id: _id.toString(),
          uid,
          nickname,
          avatar,
          gender,
          birthday,
          bio,
          phone,
          email,
          views,
          visitors: visitors.map((visitor) => visitor.toString()),
        }
      },
    },
  }
)

/**
 * 在保存文档时，自动生成uid·
 * @param {Function} next - Mongoose 中间件的 next 回调函数
 * @returns {Promise<void>}
 */
userSchema.pre('save', async function (next) {
  // 如果当前文档是新创建的且uid字段缺失
  if (this.isNew) {
    // 定义计数器的名称，这里假设为'providerIdCounter'
    const counterName = 'providerIdCounter'

    // 从数据库中查找或创建一个名为'providerIdCounter'的计数器文档，并将seq字段自增1
    const counter = await CounterModel.findOneAndUpdate(
      { name: counterName },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    )

    // 将自增后的seq值转换为字符串，并确保其长度为6位，不足6位时前面补零
    this.uid = counter.seq.toString().padStart(6, '0')
  }

  next()
})

const UserModule = model('users', userSchema)

module.exports = UserModule
