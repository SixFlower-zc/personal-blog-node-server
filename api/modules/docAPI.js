const { DocModule } = require('../../model')
const { formatResponse } = require('../../utils')

/**
 * @typedef {Object} Doc
 * @property {string} id - 文档ID
 * @property {string} creator - 创建者ID
 * @property {string} title - 文档标题
 * @property {string} content - Markdown内容
 * @property {string} category - 分类目录
 * @property {string[]} tags - 标签数组
 * @property {number} editTimes - 编辑次数
 * @property {string} [relatedProject] - 关联项目ID
 * @property {boolean} isPublic - 是否公开
 * @property {boolean} isDeleted - 是否删除
 * @property {Date} create_time - 创建时间
 * @property {Date} update_time - 更新时间
 */

/**
 * @typedef {Object} DocQueryParams
 * @property {string} [title] - 标题模糊查询
 * @property {string} [category] - 分类目录
 * @property {string[]} [tags] - 标签数组
 * @property {boolean} [isPublic] - 是否公开
 * @property {number} [page] - 页码
 * @property {number} [pageSize] - 页大小
 * @property {string} [sortField] - 排序字段
 * @property {number} [sortOrder] - 排序顺序
 */

/**
 * 创建文档
 * @param {Object} docData - 文档数据
 * @param {string} docData.title - 文档标题
 * @param {string} docData.content - 文档内容
 * @param {string} docData.category - 分类目录
 * @param {string[]} [docData.tags] - 标签数组
 * @param {string} [docData.relatedProject] - 关联项目ID
 * @param {boolean} docData.isPublic - 是否公开
 * @param {string} creatorId - 创建者ID
 * @returns {Promise<Doc>} 创建的文档
 */
const createDoc = async (docData, creatorId) => {
  const doc = new DocModule({
    ...docData,
    creator: creatorId,
    editTimes: 0,
  })
  await doc.save()
  return doc
}

/**
 * 更新文档
 * @param {string} docId - 文档ID
 * @param {Object} updateData - 更新数据
 * @param {string} [updateData.title] - 文档标题
 * @param {string} [updateData.content] - 文档内容
 * @param {string} [updateData.category] - 分类目录
 * @param {string[]} [updateData.tags] - 标签数组
 * @param {string} [updateData.relatedProject] - 关联项目ID
 * @param {boolean} [updateData.isPublic] - 是否公开
 * @returns {Promise<Doc>} 更新后的文档
 */
const updateDoc = async (docId, updateData) => {
  const doc = await DocModule.findByIdAndUpdate(
    docId,
    {
      $set: updateData,
      $inc: { editTimes: 1 },
    },
    { new: true }
  )
  return doc
}

/**
 * 删除文档（软删除）
 * @param {string} docId - 文档ID
 * @returns {Promise<Doc>} 删除后的文档
 */
const deleteDoc = async (docId) => {
  const doc = await DocModule.findByIdAndUpdate(docId, { $set: { isDeleted: true } }, { new: true })
  return doc
}

/**
 * 获取文档列表
 * @param {DocQueryParams} queryParams - 查询参数
 * @param {string} [userId] - 用户ID（用于权限控制）
 * @returns {Promise<{total: number, docs: Doc[]}>} 文档列表
 */
const getDocList = async (queryParams, userId) => {
  const {
    title,
    category,
    tags,
    isPublic,
    page = 1,
    pageSize = 10,
    sortField = 'create_time',
    sortOrder = -1,
  } = queryParams

  // 构建查询条件
  const query = { isDeleted: false }
  if (title) {
    query.title = { $regex: title, $options: 'i' }
  }
  if (category) {
    query.category = category
  }
  if (tags && tags.length > 0) {
    query.tags = { $all: tags }
  }
  if (isPublic !== undefined) {
    query.isPublic = isPublic
  }
  // 如果不是管理员，只能查看公开文档或自己的文档
  if (userId) {
    query.$or = [{ isPublic: true }, { creator: userId }]
  } else {
    query.isPublic = true
  }

  // 构建排序条件
  const sort = {}
  sort[sortField] = sortOrder

  // 执行查询
  const [total, docs] = await Promise.all([
    DocModule.countDocuments(query),
    DocModule.find(query)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize),
  ])

  return {
    total,
    docs,
  }
}

/**
 * 获取文档详情
 * @param {string} docId - 文档ID
 * @param {string} [userId] - 用户ID（用于权限控制）
 * @returns {Promise<Doc>} 文档详情
 */
const getDocDetail = async (docId, userId) => {
  const doc = await DocModule.findById(docId)
  if (!doc || doc.isDeleted) {
    throw new Error('文档不存在')
  }
  // 如果不是管理员，只能查看公开文档或自己的文档
  if (userId) {
    if (!doc.isPublic && doc.creator.toString() !== userId) {
      throw new Error('无权查看该文档')
    }
  } else if (!doc.isPublic) {
    throw new Error('无权查看该文档')
  }
  return doc
}

module.exports = {
  createDoc,
  updateDoc,
  deleteDoc,
  getDocList,
  getDocDetail,
}
