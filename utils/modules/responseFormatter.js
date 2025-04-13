/**
 * 返回数据格式化工具
 * @param {number} code - 状态码
 * @param {string} message - 状态信息
 * @param {object} data - 数据
 * @returns {object} 返回数据对象
 */
const formatResponse = (code = 200, message = 'success', data) => {
  return {
    code,
    message,
    data,
  }
}

module.exports = formatResponse
