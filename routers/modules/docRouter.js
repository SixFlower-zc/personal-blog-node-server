const express = require('express')
const { jsonParser } = require('../../middlewares')
const {
  validateDocCreate,
  validateDocUpdate,
  validateDocDelete,
  validateDocList,
  validateDocDetail,
} = require('../../lib')
const {
  createDoc,
  getDocDetail,
  addDocVisitors,
  incrementDocViews,
  updateDoc,
  deleteDoc,
  getDocList,
} = require('../../api/modules/docAPI')
const { formatResponse } = require('../../utils')
const router = express.Router()

// !: 新建文章
router.post('/', [jsonParser, validateDocCreate], async (req, res) => {
  // ?: 验证通过 新建文章
  const result = await createDoc({ ...req.body, creator: req.user.id })
  res.status(200).json(formatResponse(1, '新建文章成功', result))
})

// !: 获取文章内容
router.get('/:id', [validateDocDetail], async (req, res) => {
  // ?: 验证通过 获取文章内容
  const result = await getDocDetail(req.params.id)
  const {
    id,
    creator,
    title,
    content,
    category,
    tags,
    relatedProject,
    create_time,
    views,
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
      return res.status(200).json(formatResponse(1, '获取项目详情成功', result))
    }

    addDocVisitors(id, req.user.id)
  }

  // 增加项目访问量
  incrementDocViews(id)

  res.status(200).json(
    formatResponse(1, '获取文章详情成功', {
      id,
      creator,
      title,
      content,
      category,
      tags,
      relatedProject,
      views,
      create_time,
    })
  )
})

// !: 更新文章内容
router.post('/upload/:id', [jsonParser, validateDocUpdate], async (req, res) => {
  // ?: 验证通过 更新文章内容
  const result = await updateDoc(req.params.id, req.body)
  res.status(200).json(formatResponse(1, '更新文章成功', result))
})

// !: 删除文章(软删除)
router.delete('/:id', [validateDocDelete], async (req, res) => {
  // ?: 验证通过 删除文章(软删除)
  const result = await deleteDoc(req.params.id)
  res.status(200).json(formatResponse(1, '删除文章成功', result))
})

// !: 获取指定用户的全部文章
router.get('/list/:id', [validateDocList], async (req, res) => {
  // ?: 验证通过 获取指定用户的全部文章
  const parameters = { ...req.query, creator: req.params.id }

  // 如果没有携带用户信息，或者查询用户不是自己 则isPublic 无效
  let isUser = true
  if (!req.user || req.user.id !== req.params.id) {
    parameters.isPublic = true
    isUser = false
  }

  const result = await getDocList(parameters)

  const list = await Promise.all(
    result.list.map(async (item) => {
      const result = await getDocDetail(item.id)
      const { id, creator, title, content, category, tags, relatedProject, views, create_time } =
        result
      if (isUser) {
        return result
      }
      return {
        id,
        creator,
        title,
        content,
        category,
        tags,
        relatedProject,
        views,
        create_time,
      }
    })
  )

  res.status(200).json(formatResponse(1, '获取项目列表成功', { ...result, list }))
})

module.exports = router
