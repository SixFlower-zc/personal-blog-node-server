const { ProjectModule } = require('../../model')
const { formatResponse } = require('../../utils')

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

/**
 * 创建项目
 * @param {Object} projectData - 项目数据
 * @param {string} projectData.title - 项目标题
 * @param {string} [projectData.description] - 项目描述
 * @param {string[]} [projectData.techStack] - 技术栈标签
 * @param {string} [projectData.demoUrl] - 演示地址
 * @param {string} [projectData.githubUrl] - GitHub地址
 * @param {string} [projectData.giteeUrl] - Gitee地址
 * @param {string} [projectData.cover] - 封面图ID
 * @param {boolean} [projectData.isFeatured] - 是否置顶
 * @param {number} [projectData.weight] - 权重
 * @param {boolean} projectData.isPublic - 是否公开
 * @param {string} creatorId - 创建者ID
 * @returns {Promise<Project>} 创建的项目
 */
const createProject = async (projectData, creatorId) => {
  const project = new ProjectModule({
    ...projectData,
    creator: creatorId,
  })
  await project.save()
  return project
}

/**
 * 更新项目
 * @param {string} projectId - 项目ID
 * @param {Object} updateData - 更新数据
 * @param {string} [updateData.title] - 项目标题
 * @param {string} [updateData.description] - 项目描述
 * @param {string[]} [updateData.techStack] - 技术栈标签
 * @param {string} [updateData.demoUrl] - 演示地址
 * @param {string} [updateData.githubUrl] - GitHub地址
 * @param {string} [updateData.giteeUrl] - Gitee地址
 * @param {string} [updateData.cover] - 封面图ID
 * @param {boolean} [updateData.isFeatured] - 是否置顶
 * @param {number} [updateData.weight] - 权重
 * @param {boolean} [updateData.isPublic] - 是否公开
 * @returns {Promise<Project>} 更新后的项目
 */
const updateProject = async (projectId, updateData) => {
  const project = await ProjectModule.findByIdAndUpdate(
    projectId,
    { $set: updateData },
    { new: true }
  )
  return project
}

/**
 * 删除项目（软删除）
 * @param {string} projectId - 项目ID
 * @returns {Promise<Project>} 删除后的项目
 */
const deleteProject = async (projectId) => {
  const project = await ProjectModule.findByIdAndUpdate(
    projectId,
    { $set: { isDeleted: true } },
    { new: true }
  )
  return project
}

/**
 * 获取项目列表
 * @param {ProjectQueryParams} queryParams - 查询参数
 * @param {string} [userId] - 用户ID（用于权限控制）
 * @returns {Promise<{total: number, projects: Project[]}>} 项目列表
 */
const getProjectList = async (queryParams, userId) => {
  const {
    title,
    techStack,
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
  if (techStack && techStack.length > 0) {
    query.techStack = { $all: techStack }
  }
  if (isPublic !== undefined) {
    query.isPublic = isPublic
  }
  // 如果不是管理员，只能查看公开项目或自己的项目
  if (userId) {
    query.$or = [{ isPublic: true }, { creator: userId }]
  } else {
    query.isPublic = true
  }

  // 构建排序条件
  const sort = {}
  sort[sortField] = sortOrder

  // 执行查询
  const [total, projects] = await Promise.all([
    ProjectModule.countDocuments(query),
    ProjectModule.find(query)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize),
  ])

  return {
    total,
    projects,
  }
}

/**
 * 获取项目详情
 * @param {string} projectId - 项目ID
 * @param {string} [userId] - 用户ID（用于权限控制）
 * @returns {Promise<Project>} 项目详情
 */
const getProjectDetail = async (projectId, userId) => {
  const project = await ProjectModule.findById(projectId)
  if (!project || project.isDeleted) {
    throw new Error('项目不存在')
  }
  // 如果不是管理员，只能查看公开项目或自己的项目
  if (userId) {
    if (!project.isPublic && project.creator.toString() !== userId) {
      throw new Error('无权查看该项目')
    }
  } else if (!project.isPublic) {
    throw new Error('无权查看该项目')
  }
  return project
}

module.exports = {
  createProject,
  updateProject,
  deleteProject,
  getProjectList,
  getProjectDetail,
}
