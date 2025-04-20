/**
 * @typedef {Object} Photo
 * @property {string} _id - 图片ID
 * @property {string} url - 图片URL
 * @property {string} [description] - 图片描述
 * @property {Date} create_time - 创建时间
 */

/**
 * @typedef {Object} Video
 * @property {string} _id - 视频ID
 * @property {string} url - 视频URL
 * @property {string} [description] - 视频描述
 * @property {Date} create_time - 创建时间
 */

/**
 * @typedef {Object} Album
 * @property {string} _id - 图集ID
 * @property {string} creator - 创建者ID
 * @property {string} title - 图集标题
 * @property {string} [description] - 图集描述
 * @property {string} coverPhoto - 封面图片ID
 * @property {Photo[]} photos - 图片列表
 * @property {Video[]} [videos] - 视频列表
 * @property {number} views - 访问量
 * @property {string[]} [tags] - 标签列表
 * @property {boolean} isPublic - 是否公开
 * @property {boolean} isDeleted - 是否已删除
 * @property {Date} create_time - 创建时间
 * @property {Date} update_time - 更新时间
 */

/**
 * @typedef {Object} CreateAlbumParams
 * @property {string} creator - 创建者ID
 * @property {string} title - 图集标题
 * @property {string} [description] - 图集描述
 * @property {string} coverPhoto - 封面图片ID
 * @property {string[]} [photos] - 图片ID列表
 * @property {string[]} [videos] - 视频ID列表
 * @property {string[]} [tags] - 标签列表
 * @property {boolean} [isPublic] - 是否公开
 */

/**
 * @typedef {Object} UpdateAlbumParams
 * @property {string} [title] - 图集标题
 * @property {string} [description] - 图集描述
 * @property {string} [coverPhoto] - 封面图片ID
 * @property {string[]} [photos] - 图片ID列表
 * @property {string[]} [videos] - 视频ID列表
 * @property {string[]} [tags] - 标签列表
 * @property {boolean} [isPublic] - 是否公开
 */

/**
 * @typedef {Object} QueryAlbumParams
 * @property {string} [creator] - 创建者ID
 * @property {string} [title] - 图集标题
 * @property {string[]} [tags] - 标签列表
 * @property {boolean} [isPublic] - 是否公开
 * @property {number} [page] - 页码
 * @property {number} [pageSize] - 每页数量
 */

const AlbumModule = require('../../model/modules/AlbumModule')

/**
 * 创建图集
 * @param {CreateAlbumParams} params - 创建图集参数
 * @returns {Promise<Album>} 创建的图集
 */
async function createAlbum(params) {
  try {
    const album = new AlbumModule(params)
    return await album.save()
  } catch (error) {
    throw new Error(`创建图集失败: ${error.message}`)
  }
}

/**
 * 更新图集
 * @param {string} albumId - 图集ID
 * @param {UpdateAlbumParams} params - 更新参数
 * @returns {Promise<Album>} 更新后的图集
 */
async function updateAlbum(albumId, params) {
  try {
    const album = await AlbumModule.findByIdAndUpdate(
      albumId,
      { $set: params },
      { new: true, runValidators: true }
    )
    if (!album) {
      throw new Error('图集不存在')
    }
    return album
  } catch (error) {
    throw new Error(`更新图集失败: ${error.message}`)
  }
}

/**
 * 删除图集（软删除）
 * @param {string} albumId - 图集ID
 * @returns {Promise<Album>} 删除后的图集
 */
async function deleteAlbum(albumId) {
  try {
    const album = await AlbumModule.findByIdAndUpdate(
      albumId,
      { $set: { isDeleted: true } },
      { new: true }
    )
    if (!album) {
      throw new Error('图集不存在')
    }
    return album
  } catch (error) {
    throw new Error(`删除图集失败: ${error.message}`)
  }
}

/**
 * 获取图集详情
 * @param {string} albumId - 图集ID
 * @returns {Promise<Album>} 图集详情
 */
async function getAlbumById(albumId) {
  try {
    const album = await AlbumModule.findById(albumId)
      .populate('creator', 'username avatar')
      .populate('coverPhoto')
      .populate('photos')
      .populate('videos')
    if (!album || album.isDeleted) {
      throw new Error('图集不存在')
    }
    return album
  } catch (error) {
    throw new Error(`获取图集详情失败: ${error.message}`)
  }
}

/**
 * 查询图集列表
 * @param {QueryAlbumParams} params - 查询参数
 * @returns {Promise<{total: number, list: Album[]}>} 图集列表
 */
async function queryAlbums(params) {
  try {
    const { page = 1, pageSize = 10, ...query } = params
    const skip = (page - 1) * pageSize

    // 构建查询条件
    const conditions = { isDeleted: false }
    if (query.creator) conditions.creator = query.creator
    if (query.title) conditions.title = { $regex: query.title, $options: 'i' }
    if (query.tags) conditions.tags = { $all: query.tags }
    if (query.isPublic !== undefined) conditions.isPublic = query.isPublic

    const [total, list] = await Promise.all([
      AlbumModule.countDocuments(conditions),
      AlbumModule.find(conditions)
        .sort({ create_time: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('creator', 'username avatar')
        .populate('coverPhoto'),
    ])

    return { total, list }
  } catch (error) {
    throw new Error(`查询图集列表失败: ${error.message}`)
  }
}

/**
 * 增加图集访问量
 * @param {string} albumId - 图集ID
 * @returns {Promise<Album>} 更新后的图集
 */
async function incrementAlbumViews(albumId) {
  try {
    const album = await AlbumModule.findByIdAndUpdate(
      albumId,
      { $inc: { views: 1 } },
      { new: true }
    )
    if (!album || album.isDeleted) {
      throw new Error('图集不存在')
    }
    return album
  } catch (error) {
    throw new Error(`增加图集访问量失败: ${error.message}`)
  }
}

module.exports = {
  createAlbum,
  updateAlbum,
  deleteAlbum,
  getAlbumById,
  queryAlbums,
  incrementAlbumViews,
}
