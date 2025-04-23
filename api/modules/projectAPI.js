/**
 * @typedef {Object} Project
 * @property {string} id - 项目ID
 * @property {string} creator - 创建者ID
 * @property {string} title - 项目标题
 * @property {string} description - 项目描述
 * @property {string[]} techStack - 技术栈标签
 * @property {string} [demoUrl] - 演示地址
 * @property {string} [githubUrl] - GitHub地址
 * @property {string} [giteeUrl] - Gitee地址
 * @property {string} [cover] - 封面图ID
 * @property {boolean} isFeatured - 是否置顶
 * @property {number} weight - 权重
 * @property {boolean} isPublic - 是否公开
 * @property {boolean} isDeleted - 是否删除
 * @property {Date} create_time - 创建时间
 * @property {Date} update_time - 更新时间
 */

/**
 * @typedef {Object} ProjectQueryParams
 * @property {string} [title] - 标题模糊查询
 * @property {string[]} [techStack] - 技术栈标签
 * @property {boolean} [isPublic] - 是否公开
 * @property {number} [page] - 页码
 * @property {number} [pageSize] - 页大小
 * @property {string} [sortField] - 排序字段
 * @property {number} [sortOrder] - 排序顺序
 */

const { ProjectModule } = require('../../model')
const { getPhotoUrl } = require('./uploadAPI')

/**
 * 创建项目
 * @param {Project} projectData - 项目数据
 * @param {string} creatorId - 创建者ID
 * @returns {Promise<Project>} 创建的项目
 */
const createProject = async (projectData, creatorId) => {
  try {
    const project = new ProjectModule({
      ...projectData,
      creator: creatorId,
    })
    await project.save()
    return project.toJSON()
  } catch (error) {
    throw new Error(`创建项目失败: ${error.message}`)
  }
}

/**
 * 更新项目
 * @param {string} projectId - 项目ID
 * @param {Project} updateData - 更新数据
 * @returns {Promise<Project>} 更新后的项目
 */
const updateProject = async (projectId, updateData) => {
  try {
    const project = await ProjectModule.findByIdAndUpdate(
      projectId,
      { $set: updateData },
      { new: true }
    )
    return project.toJSON()
  } catch (error) {
    throw new Error(`更新项目失败: ${error.message}`)
  }
}

/**
 * 删除项目（软删除）
 * @param {string} projectId - 项目ID
 * @param {boolean} [isDeleted=true] - 是否删除
 * @returns {Promise<Project>} 删除后的项目
 */
const deleteProject = async (projectId, isDeleted = true) => {
  try {
    const project = await ProjectModule.findByIdAndUpdate(
      projectId,
      { $set: { isDeleted } },
      { new: true }
    )
    // 项目不存在
    if (!project) {
      throw new Error('项目不存在')
    }
    return project.toJSON()
  } catch (error) {
    throw new Error(`删除项目失败: ${error.message}`)
  }
}

/**
 * 获取项目详情
 * @param {string} projectId - 项目ID
 * @returns {Promise<Project>} 项目详情
 */
const getProjectDetail = async (projectId) => {
  try {
    const project = await ProjectModule.findById(projectId)
    if (!project || project.isDeleted) {
      throw new Error('项目不存在')
    }
    const cover = await getPhotoUrl(project.cover)

    return { ...project.toJSON(), cover }
  } catch (error) {
    throw new Error(`获取项目详情失败: ${error.message}`)
  }
}

/**
 * 项目访问量增加
 * @param {string} projectId - 项目ID
 * @returns {Promise<Project>}
 */
const increaseProjectViewCount = async (projectId) => {
  try {
    const project = await ProjectModule.findByIdAndUpdate(
      projectId,
      { $inc: { views: 1 } },
      { new: true }
    )
    return project.toJSON()
  } catch (error) {
    throw new Error(`项目访问量增加失败: ${error.message}`)
  }
}

/**
 * 访问者列表增加
 * @param {string} projectId - 项目ID
 * @param {string} visitorId - 访问者ID
 * @returns {Promise<Project>}
 */
const addProjectVisitor = async (projectId, visitorId) => {
  try {
    const project = await ProjectModule.findByIdAndUpdate(
      projectId,
      { $addToSet: { visitors: visitorId } },
      { new: true }
    )
    return project.toJSON()
  } catch (error) {
    throw new Error(`访问者列表增加失败: ${error.message}`)
  }
}

/**
 * 获取项目列表
 * @param {ProjectQueryParams} queryParams - 查询参数
 * @returns {Promise<{page: number, pageSize: number, totalCount: number, totalPage: number, sortField: string, sortOrder: number, list: Project[] }>} 项目列表
 */
const getProjectList = async (queryParams) => {
  try {
    const {
      title,
      techStack,
      isPublic = true,
      creator,
      page = 1,
      pageSize = 10,
      sortField = 'create_time',
      sortOrder = -1,
    } = queryParams
    const skip = (page - 1) * pageSize

    // 基础查询条件：只查找未删除的文档
    const conditions = { isDeleted: false, isPublic }
    // 如果存在 creator 字段，添加精确匹配条件
    if (creator) conditions.creator = creator
    // 如果存在 title 字段，添加模糊匹配条件（不区分大小写）
    if (title) conditions.title = { $regex: title, $options: 'i' }
    // 如果存在 techStack 字段，添加技术栈标签匹配条件
    if (techStack && techStack.length > 0) conditions.techStack = { $all: techStack }

    // 构建排序条件
    const sort = {}
    sort[sortField] = Number(sortOrder)

    // 执行查询
    const [total, list] = await Promise.all([
      ProjectModule.countDocuments(conditions),
      ProjectModule.find(conditions).sort(sort).skip(skip).limit(pageSize),
    ])

    if (page > 1 && page > Math.ceil(total / pageSize)) {
      throw new Error('页码超出范围')
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
  } catch (error) {
    throw new Error(`查询项目列表失败: ${error.message}`)
  }
}

module.exports = {
  createProject,
  updateProject,
  deleteProject,
  getProjectList,
  getProjectDetail,
  increaseProjectViewCount,
  addProjectVisitor,
}
