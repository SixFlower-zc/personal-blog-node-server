/**
 * @typedef {Object} Album
 * @property {string} id - 图集ID
 * @property {string} creator - 创建者ID
 * @property {string} title - 图集标题
 * @property {string} [description] - 图集描述
 * @property {string} corver - 封面图片ID
 * @property {string[]} [photos] - 图片列表
 * @property {string[]} [videos] - 视频列表
 * @property {boolean} isTop - 是否置顶
 * @property {number} [views] - 访问量
 * @property {string[]} [visitors] - 访问者ID列表
 * @property {string[]} [tags] - 标签列表
 * @property {boolean} isPublic - 是否公开
 * @property {Date} create_time - 创建时间
 * @property {Date} update_time - 更新时间
 */

/**
 * @typedef {Object} CreateAlbumParams
 * @property {string} creator - 创建者ID
 * @property {string} title - 图集标题
 * @property {string} [description] - 图集描述
 * @property {string} corver - 封面图片ID
 * @property {string[]} [photos] - 图片ID列表
 * @property {string[]} [videos] - 视频ID列表
 * @property {string[]} [tags] - 标签列表
 * @property {boolean} [isPublic] - 是否公开
 */

/**
 * @typedef {Object} UpdateAlbumParams
 * @property {string} [title] - 图集标题
 * @property {string} [description] - 图集描述
 * @property {string} [corver] - 封面图片ID
 * @property {string[]} [photos] - 图片ID列表
 * @property {string[]} [videos] - 视频ID列表
 * @property {string[]} [tags] - 标签列表
 * @property {boolean} [isPublic] - 是否公开
 */

/**
 * @typedef {Object} QueryAlbumParams
 * @property {string} creator - 创建者ID
 * @property {string} [title] - 图集标题
 * @property {string[]} [tags] - 标签列表
 * @property {boolean} [isPublic] - 是否公开
 * @property {number} [page] - 页码
 * @property {number} [pageSize] - 每页数量
 */

const { AlbumModule } = require('../../model')
const { getPhotoUrl, getVideoUrl } = require('./uploadAPI')

/**
 * 创建图集
 * @param {CreateAlbumParams} params - 创建图集参数
 * @returns {Promise<Album>} 创建的图集
 */
const createAlbum = async (params) => {
  try {
    const album = new AlbumModule(params)

    await album.save()

    return album.toJSON()
  } catch (err) {
    throw new Error(`创建图集失败: ${err.message}`)
  }
}

/**
 * 更新图集
 * @param {string} albumId - 图集ID
 * @param {UpdateAlbumParams} params - 更新参数
 * @returns {Promise<Album>} 更新后的图集
 */
const updateAlbum = async (albumId, params) => {
  try {
    const album = await AlbumModule.findByIdAndUpdate(
      albumId,
      { $set: params },
      { new: true, runValidators: true }
    )
    if (!album) {
      throw new Error('图集不存在')
    }
    return album.toJSON()
  } catch (err) {
    throw new Error(`更新图集失败: ${err.message}`)
  }
}

/**
 * 删除图集（软删除）
 * @param {string} albumId - 图集ID
 * @param {boolean} [isDeleted=true] - 是否删除（忽略isDeleted字段）
 * @returns {Promise<Album>} 删除后的图集
 */
const deleteAlbum = async (albumId, isDeleted = true) => {
  try {
    const album = await AlbumModule.findByIdAndUpdate(
      albumId,
      { $set: { isDeleted } },
      { new: true }
    )
    if (!album) {
      throw new Error('图集不存在')
    }
    return album.toJSON()
  } catch (err) {
    throw new Error(`删除图集失败: ${err.message}`)
  }
}

/**
 * 获取图集详情
 * @param {string} albumId - 图集ID
 * @returns {Promise<Album>} 图集详情
 */
const getAlbumById = async (albumId) => {
  try {
    const album = await AlbumModule.findById(albumId)
    if (!(album && !album.isDeleted)) {
      throw new Error('图集不存在')
    }

    const albumData = album.toJSON()
    if (album.photos) {
      albumData.photos = await Promise.all(
        album.photos.map(async (photoId) => {
          return getPhotoUrl(photoId)
        })
      )
    }
    if (album.cover) {
      albumData.cover = await getPhotoUrl(album.cover)
    }
    if (album.videos) {
      albumData.videos = await Promise.all(
        album.videos.map(async (videoId) => {
          return getVideoUrl(videoId)
        })
      )
    }

    return albumData
  } catch (err) {
    throw new Error(`获取图集详情失败: ${err.message}`)
  }
}

/**
 * 查询图集列表
 * @param {QueryAlbumParams} params - 查询参数
 * @returns {Promise<{page: number, pageSize: number, totalCount: number, totalPage: number, sortField: string, sortOrder: number, list: Album[]}>} 图集列表
 */
const getAlbumList = async (params) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      sortField = 'create_time',
      sortOrder = -1,
      title,
      tags,
      isPublic = true,
    } = params
    const skip = (page - 1) * pageSize

    // 基础查询条件：只查找未删除的文档
    const query = { isDeleted: false, isPublic }
    // 如果存在 title 字段，添加模糊匹配条件（不区分大小写）
    if (title) query.title = { $regex: title, $options: 'i' }
    // 如果存在 tags 字段，添加数组匹配条件（`tags` 必须包含所有查询值）
    if (tags) query.tags = { $all: tags }

    // 构建排序条件
    const sort = {}
    sort[sortField] = Number(sortOrder)

    const [total, list] = await Promise.all([
      AlbumModule.countDocuments(query),
      AlbumModule.find(query).sort(sort).skip(skip).limit(pageSize),
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
      list,
    }
  } catch (err) {
    throw new Error(`查询图集列表失败: ${err.message}`)
  }
}

/**
 * 增加图集访问量
 * @param {string} albumId - 图集ID
 * @returns {Promise<Album>} 更新后的图集
 */
const incrementAlbumViews = async (albumId) => {
  try {
    const album = await AlbumModule.findByIdAndUpdate(
      albumId,
      { $inc: { views: 1 } },
      { new: true }
    )
    if (!album || album.isDeleted) {
      throw new Error('图集不存在')
    }
    return album.toJSON()
  } catch (err) {
    throw new Error(`增加图集访问量失败: ${err.message}`)
  }
}

/**
 * 增加图集访问者
 * @param {string} albumId - 图集ID
 * @param {string} userId - 用户ID
 * @returns {Promise<Album>} 更新后的图集
 */
const addAlbumVisitor = async (albumId, userId) => {
  try {
    const album = await AlbumModule.findByIdAndUpdate(
      albumId,
      { $addToSet: { visitors: userId } },
      { new: true }
    )
    if (!album || album.isDeleted) {
      throw new Error('图集不存在')
    }
    return album.toJSON()
  } catch (err) {
    throw new Error(`增加图集访问者失败: ${err.message}`)
  }
}

module.exports = {
  createAlbum,
  updateAlbum,
  deleteAlbum,
  getAlbumById,
  getAlbumList,
  incrementAlbumViews,
  addAlbumVisitor,
}
