const { DocModule } = require('../../model')

/**
 * @typedef {Object} Doc
 * @property {string} id - 文章ID
 * @property {string} creator - 创建者ID
 * @property {string} title - 文章标题
 * @property {string} content - Markdown内容
 * @property {string} category - 分类目录
 * @property {string[]} tags - 标签数组
 * @property {number} editTimes - 编辑次数
 * @property {string} [relatedProject] - 关联项目ID
 * @property {boolean} isPublic - 是否公开
 * @property {boolean} isTop - 是否置顶
 * @property {number} [views] - 浏览量
 * @property {string[]} [visitors] - 浏览者ID数组
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
 * 创建文章
 * @param {Object} docData - 文章数据
 * @param {string} docData.title - 文章标题
 * @param {string} docData.content - 文章内容
 * @param {string} docData.category - 分类目录
 * @param {string[]} [docData.tags] - 标签数组
 * @param {string} [docData.relatedProject] - 关联项目ID
 * @param {boolean} docData.isPublic - 是否公开
 * @param {string} docData.creatorId - 创建者ID
 * @returns {Promise<Doc>} 创建的文章
 */
const createDoc = async (params) => {
  try {
    const doc = new DocModule({
      ...params,
    })
    await doc.save()
    return doc.toJSON()
  } catch (err) {
    throw new Error(`创建文章失败:${err.message}`)
  }
}

/**
 * 更新文章
 * @param {string} docId - 文章ID
 * @param {Object} updateData - 更新数据
 * @param {string} [updateData.title] - 文章标题
 * @param {string} [updateData.content] - 文章内容
 * @param {string} [updateData.category] - 分类目录
 * @param {string[]} [updateData.tags] - 标签数组
 * @param {string} [updateData.relatedProject] - 关联项目ID
 * @param {boolean} [updateData.isPublic] - 是否公开
 * @returns {Promise<Doc>} 更新后的文章
 */
const updateDoc = async (docId, updateData) => {
  try {
    // 检查是否更改isPublic
    if (updateData.isPublic) {
      // 检查是否状态为封禁
      const doc = await DocModule.findById(docId)
      if (doc.status === 'banned') {
        throw new Error('该文章已被封禁，无法公开！')
      }
    }
    const doc = await DocModule.findByIdAndUpdate(
      docId,
      {
        $set: updateData,
      },
      { new: true }
    )
    return doc.toJSON()
  } catch (err) {
    throw new Error(`更新文章失败:${err.message}`)
  }
}

/**
 * 删除文章（软删除）
 * @param {string} docId - 文章ID
 * @param {boolean} [isDeleted=true] - 是否删除
 * @returns {Promise<Doc>} 删除后的文章
 */
const deleteDoc = async (docId, isDeleted = true) => {
  try {
    const doc = await DocModule.findByIdAndUpdate(docId, { $set: { isDeleted } }, { new: true })
    // 如果文章不存在，抛出错误
    if (!doc) {
      throw new Error('文章不存在！')
    }
    return doc.toJSON()
  } catch (err) {
    throw new Error(`删除文章失败:${err.message}`)
  }
}

/**
 * 获取文章详情
 * @param {string} docId - 文章ID
 * @param {string} [userId] - 用户ID（用于权限控制）
 * @returns {Promise<Doc>} 文章详情
 */
const getDocDetail = async (docId, userId) => {
  try {
    const doc = await DocModule.findById(docId)
    if (!doc || doc.isDeleted) {
      throw new Error('文章不存在！')
    }
    return doc.toJSON()
  } catch (err) {
    throw new Error(`获取文章详情失败:${err.message}`)
  }
}

/**
 * 获取文章列表
 * @param {DocQueryParams} queryParams - 查询参数
 * @param {string} [userId] - 用户ID（用于权限控制）
 * @returns {Promise<{total: number, docs: Doc[]}>} 文章列表
 */
const getDocList = async (queryParams, userId) => {
  try {
    const {
      title,
      category,
      tags,
      relatedProject,
      isPublic = true,
      page = 1,
      pageSize = 10,
      sortField = 'create_time',
      sortOrder = -1,
    } = queryParams
    const skip = (page - 1) * pageSize

    // 构建查询条件
    const query = { isDeleted: false, isPublic }
    // 如果存在 title 字段，添加模糊匹配条件（不区分大小写）
    if (title) query.title = { $regex: title, $options: 'i' }
    // 如果存在 category 字段，添加精确匹配条件
    if (category) query.category = category
    // 如果存在 tags 字段，添加 $all 匹配条件
    if (tags && tags.length > 0) query.tags = { $all: tags }
    // 如果存在 relatedProject 字段，添加精确匹配条件
    if (relatedProject) query.relatedProject = relatedProject

    // 构建排序条件
    const sort = {}
    sort[sortField] = Number(sortOrder)

    // 执行查询
    const [total, list] = await Promise.all([
      DocModule.countDocuments(query),
      DocModule.find(query).sort(sort).skip(skip).limit(pageSize),
    ])

    if (page > 1 && page > Math.ceil(total / pageSize)) {
      throw new Error('页码超出范围！')
    }

    return {
      page,
      pageSize,
      totalCount: total,
      totalPage: Math.ceil(total / pageSize),
      sortField,
      sortOrder,
      list: list.map((project) => project.toJSON()),
    }
  } catch (err) {
    throw new Error(`获取文章列表失败:${err.message}`)
  }
}

/** 增加文章浏览量 */
const incrementDocViews = async (docId) => {
  try {
    const doc = await DocModule.findByIdAndUpdate(docId, { $inc: { views: 1 } }, { new: true })
    return doc.toJSON()
  } catch (err) {
    throw new Error(`增加文章浏览量失败:${err.message}`)
  }
}

/** 文章访问者列表增加 */
const addDocVisitors = async (docId, visitorId) => {
  try {
    const doc = await DocModule.findByIdAndUpdate(
      docId,
      { $addToSet: { visitors: visitorId } },
      { new: true }
    )
    return doc.toJSON()
  } catch (err) {
    throw new Error(`文章访问者列表增加失败:${err.message}`)
  }
}

module.exports = {
  createDoc,
  updateDoc,
  deleteDoc,
  getDocList,
  getDocDetail,
  incrementDocViews,
  addDocVisitors,
}
