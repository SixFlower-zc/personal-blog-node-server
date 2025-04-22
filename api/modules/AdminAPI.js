const { AdminModule } = require('../../model')
const { formatResponse, generateToken, verifyPassword } = require('../../utils')
const { createAdminLog } = require('./AdminLogAPI')

/**
 * @typedef {Object} Admin
 * @property {string} id - 管理员ID
 * @property {string} aid - 管理员专属ID
 * @property {string} nickname - 昵称
 * @property {string} email - 邮箱
 * @property {number} role - 权限等级
 * @property {string[]} routes - 权限路由
 * @property {string} status - 状态
 * @property {Date} lastLoginTime - 最后登录时间
 * @property {string} lastLoginIP - 最后登录IP
 * @property {boolean} isDeleted - 是否删除
 * @property {Date} create_time - 创建时间
 * @property {Date} update_time - 更新时间
 */

/**
 * 管理员登录
 * @param {Object} loginData - 登录数据
 * @param {string} loginData.aid - 管理员ID
 * @param {string} loginData.password - 密码
 * @param {string} ip - 登录IP
 * @returns {Promise<{admin: Admin, token: string}>} 管理员信息和token
 */
const adminLogin = async (loginData, ip) => {
  const { aid, password } = loginData

  // 查找管理员
  const admin = await AdminModule.findOne({ aid })
  if (!admin) {
    throw new Error('管理员ID不存在')
  }

  // 验证密码
  if (!(await verifyPassword(password, admin.password))) {
    throw new Error('密码错误')
  }

  // 更新登录信息
  admin.lastLoginTime = new Date()
  admin.lastLoginIP = ip
  await admin.save()

  // 生成token
  const token = generateToken(admin._id, admin.role)

  // 记录登录日志
  await createAdminLog({
    adminId: admin._id,
    aid: admin.aid,
    type: 'LOGIN',
    description: '管理员登录',
    detail: {
      loginTime: admin.lastLoginTime,
      loginIP: ip,
    },
    ip,
  })

  return {
    admin,
    token,
  }
}

/**
 * 创建管理员
 * @param {Object} adminData - 管理员数据
 * @param {string} adminData.password - 密码
 * @param {string} adminData.nickname - 昵称
 * @param {string} adminData.email - 邮箱
 * @param {number} adminData.role - 权限等级
 * @param {string} operatorId - 操作者ID
 * @param {string} operatorAid - 操作者专属ID
 * @param {string} ip - 操作IP
 * @returns {Promise<Admin>} 创建的管理员
 */
const createAdmin = async (adminData, operatorId, operatorAid, ip) => {
  const admin = new AdminModule(adminData)
  await admin.save()

  // 记录创建日志
  await createAdminLog({
    adminId: operatorId,
    aid: operatorAid,
    type: 'CREATE_ADMIN',
    description: '创建管理员',
    detail: {
      targetAdminId: admin._id,
      targetAid: admin.aid,
      adminData,
    },
    ip,
  })

  return admin
}

/**
 * 更新管理员信息
 * @param {string} adminId - 管理员ID
 * @param {Object} updateData - 更新数据
 * @param {string} [updateData.nickname] - 昵称
 * @param {string} [updateData.email] - 邮箱
 * @param {number} [updateData.role] - 权限等级
 * @param {string} operatorId - 操作者ID
 * @param {string} operatorAid - 操作者专属ID
 * @param {string} ip - 操作IP
 * @returns {Promise<Admin>} 更新后的管理员
 */
const updateAdmin = async (adminId, updateData, operatorId, operatorAid, ip) => {
  const admin = await AdminModule.findByIdAndUpdate(adminId, { $set: updateData }, { new: true })

  // 记录更新日志
  await createAdminLog({
    adminId: operatorId,
    aid: operatorAid,
    type: 'UPDATE_ADMIN',
    description: '更新管理员信息',
    detail: {
      targetAdminId: adminId,
      updateData,
    },
    ip,
  })

  return admin
}

/**
 * 删除管理员(软删除)
 * @param {string} adminId - 管理员ID
 * @param {string} operatorId - 操作者ID
 * @param {string} operatorAid - 操作者专属ID
 * @param {string} ip - 操作IP
 * @returns {Promise<Admin>} 删除后的管理员
 */
const deleteAdmin = async (adminId, operatorId, operatorAid, ip) => {
  const admin = await AdminModule.findByIdAndUpdate(
    adminId,
    { $set: { isDeleted: true } },
    { new: true }
  )

  // 记录删除日志
  await createAdminLog({
    adminId: operatorId,
    aid: operatorAid,
    type: 'DELETE_ADMIN',
    description: '删除管理员',
    detail: {
      targetAdminId: adminId,
    },
    ip,
  })

  return admin
}

/**
 * 获取管理员列表
 * @param {Object} queryParams - 查询参数
 * @param {number} [queryParams.page=1] - 页码
 * @param {number} [queryParams.pageSize=10] - 页大小
 * @param {string} [queryParams.keyword] - 关键词(搜索aid/昵称/邮箱)
 * @param {number} [queryParams.role] - 权限等级
 * @param {string} [queryParams.status] - 状态
 * @returns {Promise<{total: number, admins: Admin[]}>} 管理员列表
 */
const getAdminList = async (queryParams) => {
  const { page = 1, pageSize = 10, keyword, role, status } = queryParams

  // 构建查询条件
  const query = { isDeleted: false }
  if (keyword) {
    query.$or = [
      { aid: { $regex: keyword, $options: 'i' } },
      { nickname: { $regex: keyword, $options: 'i' } },
      { email: { $regex: keyword, $options: 'i' } },
    ]
  }
  if (role) {
    query.role = role
  }
  if (status) {
    query.status = status
  }

  // 执行查询
  const [total, admins] = await Promise.all([
    AdminModule.countDocuments(query),
    AdminModule.find(query)
      .sort({ create_time: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
  ])

  return {
    total,
    admins,
  }
}

/**
 * 获取管理员详情
 * @param {string} adminId - 管理员ID
 * @returns {Promise<Admin>} 管理员详情
 */
const getAdminDetail = async (adminId) => {
  const admin = await AdminModule.findById(adminId)
  if (!admin || admin.isDeleted) {
    throw new Error('管理员不存在')
  }
  return admin
}

module.exports = {
  adminLogin,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getAdminList,
  getAdminDetail,
}
