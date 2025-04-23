const express = require('express')
const { formatResponse } = require('../../utils')
const {
  validateAlbumCreate,
  validateGetAlbumDetail,
  validateAlbumUpdate,
  validateAlbumDelete,
  validateUserAlbumList,
} = require('../../lib/modules/albumRule')
const { jsonParser } = require('../../middlewares')
const {
  createAlbum,
  updatePhoto,
  updateVideo,
  getAlbumById,
  incrementAlbumViews,
  updateAlbum,
  deleteAlbum,
  getAlbumList,
  addAlbumVisitor,
} = require('../../api')
const { AlbumModule } = require('../../model')
const router = express.Router()

// !: 图集创建接口
router.post('/create', [jsonParser, validateAlbumCreate], async (req, res) => {
  // ?: 实现图集创建接口
  const { cover, photos, videos } = req.body

  const parameters = {
    creator: req.user.id,
    ...req.body,
  }

  if (photos) {
    parameters.cover = photos[cover || 0]
  }

  const result = await createAlbum(parameters)

  if (photos && photos.length > 0) {
    photos.forEach((v) => {
      updatePhoto(v, {
        creator: req.user.id,
        album: result.id,
      })
    })
  }

  if (videos && videos.length > 0) {
    videos.forEach((v) => {
      updateVideo(v, {
        creator: req.user.id,
        album: result.id,
      })
    })
  }

  const data = await getAlbumById(result.id)

  res.status(200).json(formatResponse(1, '图集创建成功', data))
})

// !: 图集信息修改接口
router.post('/update/:id', [jsonParser, validateAlbumUpdate], async (req, res) => {
  // ?: 实现图集信息修改接口
  const { id } = req.params
  const { cover, photos, videos } = req.body

  const parameters = {
    ...req.body,
  }

  if (cover || cover === 0) {
    if (photos) {
      parameters.cover = photos[cover]
    } else {
      parameters.cover = (await AlbumModule.findById(id)).photos[cover]
    }
  }

  await updateAlbum(id, parameters)

  if (photos && photos.length > 0) {
    photos.forEach((v) => {
      updatePhoto(v, {
        creator: req.user.id,
        album: id,
      })
    })
  }

  if (videos && videos.length > 0) {
    videos.forEach((v) => {
      updateVideo(v, {
        creator: req.user.id,
        album: id,
      })
    })
  }

  const result = await getAlbumById(id)

  res.status(200).json(formatResponse(1, '图集信息修改成功', result))
})

// !: 图集信息获取接口 实现图集所有者与非所有者的获取接口
router.get('/:id', [validateGetAlbumDetail], async (req, res) => {
  // ?: 实现图集信息获取接口
  const { id } = req.params

  const result = await getAlbumById(id)
  const { creator, title, description, photos, videos, tags, create_time, isPublic } = result

  // 如果是非公开项目
  if ((!req.user && !isPublic) || (req.user && req.user.id !== creator && !isPublic)) {
    return res.status(403).json(formatResponse(0, '无权访问'))
  }

  // 请求者携带token
  if (req.user) {
    // 所有者
    if (req.user.id === creator) {
      return res.status(200).json(formatResponse(1, '图集信息获取成功', result))
    }

    // 非所有者 将用户id加入到访问者列表
    addAlbumVisitor(id, req.user.id)
  }

  // 增加访问量
  incrementAlbumViews(id)

  res.status(200).json(
    formatResponse(1, '图集信息获取成功', {
      id,
      creator,
      title,
      description,
      photos,
      videos,
      tags,
      create_time,
    })
  )
})

// !: 图集删除接口(软删除)
router.delete('/:id', [validateAlbumDelete], async (req, res) => {
  // ?: 实现图集删除接口(软删除)
  const { id } = req.params

  await deleteAlbum(id)

  res.status(200).json(formatResponse(1, '图集删除成功'))
})

// !: 图集列表获取接口(所有者与非所有者)
router.get('/list/:id', [validateUserAlbumList], async (req, res) => {
  // ?: 实现图集列表获取接口(所有者与非所有者)

  const parameters = { ...req.query, creator: req.params.id }

  // 如果没有携带用户信息，或者查询用户不是自己 则isPublic 无效
  let isUser = true
  if (!req.user || req.user.id !== req.params.id) {
    parameters.isPublic = true
    isUser = false
  }

  const result = await getAlbumList(parameters)
  const list = await Promise.all(
    result.list.map(async (v) => {
      const result = await getAlbumById(v.id)

      const { id, creator, title, description, photos, videos, tags, create_time } = result
      if (isUser) {
        return result
      }
      return { id, creator, title, description, photos, videos, tags, create_time }
    })
  )

  res.status(200).json(formatResponse(1, '图集列表获取成功', { ...result, list }))
})

module.exports = router
