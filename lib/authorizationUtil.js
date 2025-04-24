const express = require('express')
const { verification } = require('../utils')
const { UserModule, AdminModule } = require('../model')
const dayjs = require('dayjs')
/**
 * 普通用户身份认证并处理token-工具函数
 * @param {string} token
 * @param {express.Request} req
 * @returns
 */
const userAuthorizationUtil = async (token, req) => {
  try {
    // 自定义校验：检查token是否有效
    const decoded = await verification(token)

    req.user = decoded

    // 自定义校验：检查用户是否存在
    const user = await UserModule.findById(decoded.id)
    if (!user || user.isDeleted) {
      throw new Error('用户不存在')
    }

    // 检查账户状态
    if (user.status !== 'active') {
      throw new Error('账户已被禁用')
    }

    // 检查账户是否被锁定
    if (user.lockUntil > Date.now()) {
      throw new Error(
        `账户已被锁定，请联系管理员或在${dayjs(user.lockUntil).format('YYYY-MM-DD HH:mm:ss')}后重试`
      )
    }
  } catch (err) {
    throw new Error(`身份认证失败:${err.message}`)
  }
}

/**
 * 管理员身份认证并处理token-工具函数
 * @param {string} token
 * @param {express.Request} req
 * @returns
 */
const adminAuthorizationUtil = async (token, req) => {
  try {
    // 自定义校验：检查token是否有效
    const decoded = await verification(token)

    req.user = decoded

    // 自定义校验：检查用户是否存在
    const admin = await AdminModule.findById(decoded.id)
    if (!(admin && !admin.isDeleted)) {
      throw new Error('用户不存在或不是管理员')
    }
  } catch (err) {
    throw new Error(`身份认证失败:${err.message}`)
  }
}

module.exports = {
  userAuthorizationUtil,
  adminAuthorizationUtil,
}
