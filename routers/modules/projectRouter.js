const express = require('express')
const { formatResponse } = require('../../utils')
const { jsonParser } = require('../../middlewares')
const {
  validateProjectCreate,
  validateProjectUpdate,
  validateProjectDetail,
  validateProjectDelete,
  validateProjectList,
} = require('../../lib')
const {
  createProject,
  updateProject,
  getProjectDetail,
  increaseProjectViewCount,
  addProjectVisitor,
  deleteProject,
  getProjectList,
} = require('../../api/modules/projectAPI')
const router = express.Router()

// !: 创建项目
router.post('/create', [jsonParser, validateProjectCreate], async (req, res) => {
  // ?: 验证通过，创建项目
  const result = await createProject(req.body, req.user.id)
  res.status(200).json(formatResponse(200, '项目创建成功', result))
})

// !: 获取项目详情
router.get('/:id', [validateProjectDetail], async (req, res) => {
  // ?: 验证通过，获取项目详情
  const result = await getProjectDetail(req.params.id)
  const {
    id,
    creator,
    title,
    description,
    cover,
    techStack,
    demoUrl,
    githubUrl,
    giteeUrl,
    isFeatured,
    weight,
    isPublic,
  } = result

  // 如果是非公开项目
  if ((!req.user && !isPublic) || (req.user && req.user.id !== creator && !isPublic)) {
    return res.status(403).json(formatResponse(0, '无权访问'))
  }

  // 如果携带token
  if (req.user) {
    // 如果是项目创建者
    if (req.user.id === result.creator) {
      return res.status(200).json(formatResponse(200, '获取项目详情成功', result))
    }

    addProjectVisitor(id, req.user.id)
  }

  // 增加项目访问量
  increaseProjectViewCount(req.params.id)

  res.status(200).json(
    formatResponse(200, '获取项目详情成功', {
      id,
      creator,
      title,
      description,
      cover,
      techStack,
      demoUrl,
      githubUrl,
      giteeUrl,
      isFeatured,
      weight,
    })
  )
})

// !: 更新项目
router.post('/update/:id', [jsonParser, validateProjectUpdate], async (req, res) => {
  // ?: 验证通过，更新项目信息
  const result = await updateProject(req.params.id, req.body)
  res.status(200).json(formatResponse(200, '项目更新成功', result))
})

// !: 删除项目
router.delete('/:id', [validateProjectDelete], async (req, res) => {
  const result = await deleteProject(req.params.id)
  res.status(200).json(formatResponse(200, '项目删除成功', result))
})

// !: 获取项目列表
router.get('/list/:id', [jsonParser, validateProjectList], async (req, res) => {
  // ?: 验证通过，获取项目列表
  const parameters = { ...req.query, creator: req.params.id }

  // 如果没有携带用户信息，或者查询用户不是自己 则isPublic 无效
  let isUser = true
  if (!req.user || req.user.id !== req.params.id) {
    parameters.isPublic = true
    isUser = false
  }

  const result = await getProjectList(parameters)

  const list = await Promise.all(
    result.list.map(async (item) => {
      const result = await getProjectDetail(item.id)
      const {
        id,
        creator,
        title,
        description,
        cover,
        techStack,
        demoUrl,
        githubUrl,
        giteeUrl,
        isFeatured,
        weight,
      } = result
      if (isUser) {
        return result
      }
      return {
        id,
        creator,
        title,
        description,
        cover,
        techStack,
        demoUrl,
        githubUrl,
        giteeUrl,
        isFeatured,
        weight,
      }
    })
  )

  res.status(200).json(formatResponse(200, '获取项目列表成功', { ...result, list }))
})

module.exports = router
