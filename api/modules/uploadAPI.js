/**
 * @typedef {Object} MediaMetadata - 文件元数据
 * @property {String} format - 文件格式
 * @property {Number} size - 文件大小（字节）
 */

/**
 * @typedef {Object} MediaBase - 媒体记录的基类
 * @property {String} id - 记录ID
 * @property {String} [creator] - 上传者ID
 * @property {String} filename - 文件名
 * @property {String} url - 文件链接
 * @property {String} [album] - 所属图集ID
 * @property {MediaMetadata} metadata - 文件元数据
 */

/**
 * @typedef {Object} MediaUpdate - 媒体文件更新信息
 * @property {String} [creator] - 上传者ID
 * @property {String} [album] - 所属图集ID
 * @property {String} [isPublic] - 是否公开
 */

const { PhotoModule, VideoModule } = require('../../model')

/**
 * 创建照片记录
 * @param {Object} photoData - 照片数据
 * @param {String} photoData.filename - 文件名
 * @param {String} photoData.url - 图片链接
 * @param {MediaMetadata} photoData.metadata - 图片元数据
 * @returns {Promise<MediaBase>} 创建的照片记录
 */
const createPhoto = async (photoData) => {
  try {
    const photo = new PhotoModule(photoData)
    await photo.save()
    return photo.toJSON()
  } catch (err) {
    throw new Error(`创建照片记录失败: ${err.message}`)
  }
}

/**
 * 创建视频记录
 * @param {Object} videoData - 视频数据
 * @param {String} videoData.filename - 文件名
 * @param {String} videoData.url - 视频链接
 * @param {MediaMetadata} videoData.metadata - 视频元数据
 * @returns {Promise<MediaBase>} 创建的视频记录
 */
const createVideo = async (videoData) => {
  try {
    const video = new VideoModule(videoData)
    await video.save()
    return video.toJSON()
  } catch (err) {
    throw new Error(`创建视频记录失败: ${err.message}`)
  }
}

/**
 * 更新照片记录
 * @param {String} photoId
 * @param {MediaUpdate} photoData
 * @returns {Promise<MediaBase>} 更新后的照片记录
 */
const updatePhoto = async (photoId, photoData) => {
  try {
    // 检查是否更改isPublic
    if (photoData.isPublic) {
      // 检查是否状态为封禁
      const photo = await PhotoModule.findById(photoId)
      if (photo.status === 'banned') {
        throw new Error('该图片已被封禁，无法公开！')
      }
    }

    const photo = await PhotoModule.findByIdAndUpdate(photoId, { $set: photoData }, { new: true })
    return photo.toJSON()
  } catch (err) {
    throw new Error(`更新照片记录失败: ${err.message}`)
  }
}

/**
 * 更新视频记录
 * @param {String} videoId
 * @param {MediaUpdate} videoData
 * @returns {Promise<MediaBase>} 更新后的视频记录
 */
const updateVideo = async (videoId, videoData) => {
  try {
    // 检查是否更改isPublic
    if (videoData.isPublic) {
      // 检查是否状态为封禁
      const video = await VideoModule.findById(videoId)
      if (video.status === 'banned') {
        throw new Error('该视频已被封禁，无法公开！')
      }
    }

    const video = await VideoModule.findByIdAndUpdate(videoId, { $set: videoData }, { new: true })
    return video.toJSON()
  } catch (err) {
    throw new Error(`更新视频记录失败: ${err.message}`)
  }
}

/**
 * 获取用户的所有照片
 * @param {String} creatorId - 用户ID
 * @returns {Promise<Array<MediaBase>>} 照片列表
 */
const getUserPhotos = async (creatorId) => {
  try {
    const photos = await PhotoModule.find({ creator: creatorId }).sort({ create_time: -1 })
    return photos.map((photo) => photo.toJSON())
  } catch (err) {
    throw new Error(`获取用户照片失败: ${err.message}`)
  }
}

/**
 * 获取用户的所有视频
 * @param {String} creatorId - 用户ID
 * @returns {Promise<Array<MediaBase>>} 视频列表
 */
const getUserVideos = async (creatorId) => {
  try {
    const videos = await VideoModule.find({ creator: creatorId }).sort({ create_time: -1 })
    return videos.map((video) => video.toJSON())
  } catch (err) {
    throw new Error(`获取用户视频失败: ${err.message}`)
  }
}

/**
 * 软删除照片
 * @param {String} photoId - 照片ID
 * @param {Boolean} [isDeleted=true] - 是否删除
 * @returns {Promise<MediaBase>} 更新后的照片记录
 */
const softDeletePhoto = async (photoId, isDeleted = true) => {
  try {
    const photo = await PhotoModule.findByIdAndUpdate(
      photoId,
      { $set: { isDeleted } },
      { new: true }
    )
    return photo.toJSON()
  } catch (err) {
    throw new Error(`删除照片失败: ${err.message}`)
  }
}

/**
 * 软删除视频
 * @param {String} videoId - 视频ID
 * @param {Boolean} [isDeleted=true] - 是否删除
 * @returns {Promise<MediaBase>} 更新后的视频记录
 */
const softDeleteVideo = async (videoId, isDeleted = true) => {
  try {
    const video = await VideoModule.findByIdAndUpdate(
      videoId,
      { $set: { isDeleted } },
      { new: true }
    )
    return video.toJSON()
  } catch (err) {
    throw new Error(`删除视频失败: ${err.message}`)
  }
}

/**
 * 获取图片url
 * @param {String} photoId - 照片ID
 * @returns {String} 图片url
 */
const getPhotoUrl = async (photoId) => {
  try {
    const photo = await PhotoModule.findById(photoId)
    if (!photo) {
      throw new Error('照片不存在！')
    }
    return photo.url
  } catch (err) {
    throw new Error(`获取图片url失败: ${err.message}`)
  }
}

/**
 * 获取视频url
 * @param {String} videoId - 视频ID
 * @returns {String} 视频url
 */
const getVideoUrl = async (videoId) => {
  try {
    const video = await VideoModule.findById(videoId)
    if (!video) {
      throw new Error('视频不存在！')
    }
    return video.url
  } catch (err) {
    throw new Error(`获取视频url失败: ${err.message}`)
  }
}

module.exports = {
  createPhoto,
  createVideo,
  updatePhoto,
  updateVideo,
  getUserPhotos,
  getUserVideos,
  softDeletePhoto,
  softDeleteVideo,
  getPhotoUrl,
  getVideoUrl,
}
