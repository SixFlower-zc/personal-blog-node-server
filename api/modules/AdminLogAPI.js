const { AdminLogModule } = require('../../model')
const { formatResponse } = require('../../utils')

/**
 * 创建操作日志
 * @param {Object} logData - 日志数据
 * @param {string} logData.adminId - 管理员ID
 * @param {string} logData.aid - 管理员专属ID
 * @param {string} logData.type - 操作类型
 * @param {string} logData.description - 操作描述
 * @param {Object} [logData.detail] - 操作详情
 * @param {string} logData.ip - 操作IP
 * @returns {Promise<Object>} 创建的日志
 */
const createAdminLog = async (logData) => {
  const log = new AdminLogModule(logData)
  await log.save()
  return log
}

/**
 * 获取管理员操作日志列表
 * @param {Object} queryParams - 查询参数
 * @param {string} [queryParams.adminId] - 管理员ID
 * @param {string} [queryParams.type] - 操作类型
 * @param {string} [queryParams.startTime] - 开始时间
 * @param {string} [queryParams.endTime] - 结束时间
 * @param {number} [queryParams.page=1] - 页码
 * @param {number} [queryParams.pageSize=10] - 页大小
 * @returns {Promise<{total: number, logs: Object[]}>} 日志列表
 */
const getAdminLogList = async (queryParams) => {
  const { adminId, type, startTime, endTime, page = 1, pageSize = 10 } = queryParams

  // 构建查询条件
  const query = {}
  if (adminId) {
    query.adminId = adminId
  }
  if (type) {
    query.type = type
  }
  if (startTime || endTime) {
    query.create_time = {}
    if (startTime) {
      query.create_time.$gte = new Date(startTime)
    }
    if (endTime) {
      query.create_time.$lte = new Date(endTime)
    }
  }

  // 执行查询
  const [total, logs] = await Promise.all([
    AdminLogModule.countDocuments(query),
    AdminLogModule.find(query)
      .sort({ create_time: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate('adminId', 'aid nickname'),
  ])

  return {
    total,
    logs,
  }
}

/**
 * 获取操作日志详情
 * @param {string} logId - 日志ID
 * @returns {Promise<Object>} 日志详情
 */
const getAdminLogDetail = async (logId) => {
  const log = await AdminLogModule.findById(logId).populate('adminId', 'aid nickname')
  if (!log) {
    throw new Error('日志不存在')
  }
  return log
}

module.exports = {
  createAdminLog,
  getAdminLogList,
  getAdminLogDetail,
}
