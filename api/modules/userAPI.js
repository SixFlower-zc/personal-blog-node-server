const dayjs = require('dayjs')
const { UserModule } = require('../../model')
const { hashPassword, verifyPassword } = require('../../utils')

/**
 * 用户信息类型
 * @typedef {Object} UserInfo
 * @property {string} id - 用户ID
 * @property {string} uid - 用户唯一标识
 * @property {string} nickname - 用户昵称
 * @property {string} avatar - 用户头像
 * @property {'Male' | 'Female' | 'hidden'} gender - 用户性别
 * @property {Date} birthday - 用户生日
 * @property {string} bio - 用户简介
 * @property {string} [phone] - 用户电话
 * @property {string} email - 用户邮箱
 */

/**
 * 用户注册
 * @param {object} options - 参数
 * @param {string} options.password - 用户密码
 * @param {string} options.email - 用户邮箱
 * @param {string} options.ip - 注册IP地址
 * @returns {Promise<UserInfo>} 新创建的用户信息
 */
const registerUser = async (options) => {
  const { password } = options

  try {
    // 加密密码
    const hashedPassword = await hashPassword(password)

    // 创建新用户
    const newUser = new UserModule({
      ...options,
      password: hashedPassword,
      registerIP: options.ip || '',
    })

    await newUser.save()
    return newUser.toJSON()
  } catch (error) {
    throw error
  }
}

/**
 * 用户登录
 * @param {object} options - 参数
 * @param {string} [options.uid] - 用户ID
 * @param {string} [options.email] - 用户邮箱
 * @param {string} [options.phone] - 用户手机号
 * @param {string} options.password - 用户密码
 * @param {string} options.ip - 登录IP地址
 * @returns {Promise<UserInfo>} 包含用户信息和token的对象
 */
const loginUser = async (options) => {
  const { uid, email, phone, password, ip } = options

  try {
    let user = await UserModule.findOne({ uid })
    console.log('uid', user)
    if (email) {
      user = await UserModule.findOne({ email })
      console.log('email')
    } else if (phone) {
      user = await UserModule.findOne({ phone })
      console.log('phone', user)
    }

    if (!user) {
      throw new Error('用户不存在')
    }

    // 检查账户状态
    if (user.status !== 'active') {
      throw new Error('账户已被禁用')
    }

    // 检查账户是否被锁定
    if (user.lockUntil && user.lockUntil > Date.now()) {
      throw new Error(
        `账户已被锁定，请在${dayjs(user.lockUntil).format('YYYY-MM-DD HH:mm:ss')}后重试`
      )
    }

    // 验证密码
    const isMatch = await verifyPassword(password, user.password)

    if (!isMatch) {
      // 增加失败尝试次数
      user.failedAttempts += 1
      if (user.failedAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + Math.pow(2, user.riskLevel) * 30 * 60 * 1000) // 锁定30分钟
        // 账号风险等级 + 1
        user.riskLevel = user.riskLevel + 1
      }
      await user.save()
      throw new Error(
        '密码错误, 还有' +
          (5 - user.failedAttempts) +
          `次机会${
            user.failedAttempts >= 5
              ? ',账号已被锁定,请在' +
                dayjs(user.lockUntil).format('YYYY-MM-DD HH:mm:ss') +
                '后重试'
              : ''
          }`
      )
    }

    // 重置失败尝试次数
    user.failedAttempts = 0
    user.lastLoginIP = ip
    user.lastLoginTime = new Date()
    await user.save()

    return user.toJSON()
  } catch (error) {
    throw error
  }
}

/**
 * 更新用户信息
 * @param {string} userId - 用户ID
 * @param {Object} updateData - 要更新的数据
 * @param {string} [updateData.nickname] - 用户昵称
 * @param {string} [updateData.avatar] - 用户头像
 * @param {string} [updateData.gender] - 用户性别
 * @param {Date} [updateData.birthday] - 用户生日
 * @param {string} [updateData.bio] - 用户简介
 * @returns {Promise<User>} 更新后的用户对象
 */
const updateUser = async (userId, updateData) => {
  try {
    const updatedUser = await UserModule.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    )

    if (!updatedUser) {
      throw new Error('用户不存在')
    }

    return updatedUser
  } catch (error) {
    throw error
  }
}

/**
 * 获取用户信息 用于返回给客户端
 * @param {string} userId - 用户ID
 * @returns {Promise<UserInfo>} 用户对象
 */
const getUserById = async (userId) => {
  try {
    const user = await UserModule.findById(userId)
    if (!user) {
      throw new Error('用户不存在')
    }
    return user.toJSON()
  } catch (error) {
    throw error
  }
}

/**
 * 删除用户（软删除）
 * @param {string} userId - 用户ID
 * @returns {Promise<User>} 删除后的用户对象
 */
const deleteUser = async (userId) => {
  try {
    const user = await UserModule.findByIdAndUpdate(
      userId,
      { $set: { isDeleted: true } },
      { new: true }
    )
    if (!user) {
      throw new Error('用户不存在')
    }
    return user
  } catch (error) {
    throw error
  }
}

/**
 * 重置密码
 * @param {string} email - 用户邮箱
 * @param {string} newPassword - 新密码
 * @returns {Promise<UserInfo>} 更新后的用户对象
 */
const resetPassword = async (email, newPassword) => {
  try {
    const hashedPassword = await hashPassword(newPassword)

    const user = await UserModule.findOneAndUpdate(
      { email },
      { $set: { password: hashedPassword } },
      { new: true }
    )

    if (!user) {
      throw new Error('用户不存在')
    }

    return user.toJSON()
  } catch (error) {
    throw error
  }
}

module.exports = {
  registerUser,
  loginUser,
  updateUser,
  getUserById,
  deleteUser,
  resetPassword,
}
