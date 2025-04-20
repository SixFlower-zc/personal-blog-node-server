const { PhotoModule, VideoModule } = require('../../model')

/**
 * @typedef {Object} MediaMetadata
 * @property {String} format - 文件格式
 * @property {Number} size - 文件大小（字节）
 */

/**
 * @typedef {Object} MediaBase
 * @property {String} id - 记录ID
 * @property {String} creator - 上传者ID
 * @property {String} filename - 文件名
 * @property {String} url - 文件链接
 * @property {String} [album] - 所属图集ID
 * @property {MediaMetadata} metadata - 文件元数据
 */

/**
 * 创建照片记录
 * @param {Object} photoData - 照片数据
 * @param {String} photoData.creator - 上传者ID
 * @param {String} photoData.filename - 文件名
 * @param {String} photoData.url - 图片链接
 * @param {MediaMetadata} photoData.metadata - 图片元数据
 * @param {Boolean} [photoData.isPublic] - 是否公开
 * @returns {Promise<MediaBase>} 创建的照片记录
 */
const createPhoto = async (photoData) => {
  try {
    const photo = new PhotoModule(photoData)
    await photo.save()
    return photo.toJSON()
  } catch (error) {
    throw new Error(`创建照片记录失败: ${error.message}`)
  }
}

/**
 * 创建视频记录
 * @param {Object} videoData - 视频数据
 * @param {String} videoData.creator - 上传者ID
 * @param {String} videoData.filename - 文件名
 * @param {String} videoData.url - 视频链接
 * @param {MediaMetadata} videoData.metadata - 视频元数据
 * @param {Boolean} [videoData.isPublic] - 是否公开
 * @returns {Promise<MediaBase>} 创建的视频记录
 */
const createVideo = async (videoData) => {
  try {
    const video = new VideoModule(videoData)
    await video.save()
    return video.toJSON()
  } catch (error) {
    throw new Error(`创建视频记录失败: ${error.message}`)
  }
}

/**
 * 获取用户的所有照片
 * @param {String} creatorId - 用户ID
 * @returns {Promise<Array<MediaBase>>} 照片列表
 */
const getUserPhotos = async (creatorId) => {
  try {
    const photos = await PhotoModule.find({ creator: creatorId })
    return photos.map((photo) => photo.toJSON())
  } catch (error) {
    throw new Error(`获取用户照片失败: ${error.message}`)
  }
}

/**
 * 获取用户的所有视频
 * @param {String} creatorId - 用户ID
 * @returns {Promise<Array<MediaBase>>} 视频列表
 */
const getUserVideos = async (creatorId) => {
  try {
    const videos = await VideoModule.find({ creator: creatorId })
    return videos.map((video) => video.toJSON())
  } catch (error) {
    throw new Error(`获取用户视频失败: ${error.message}`)
  }
}

/**
 * 软删除照片
 * @param {String} photoId - 照片ID
 * @returns {Promise<MediaBase>} 更新后的照片记录
 */
const softDeletePhoto = async (photoId) => {
  try {
    const photo = await PhotoModule.findByIdAndUpdate(photoId, { isDeleted: true }, { new: true })
    return photo.toJSON()
  } catch (error) {
    throw new Error(`删除照片失败: ${error.message}`)
  }
}

/**
 * 软删除视频
 * @param {String} videoId - 视频ID
 * @returns {Promise<MediaBase>} 更新后的视频记录
 */
const softDeleteVideo = async (videoId) => {
  try {
    const video = await VideoModule.findByIdAndUpdate(videoId, { isDeleted: true }, { new: true })
    return video.toJSON()
  } catch (error) {
    throw new Error(`删除视频失败: ${error.message}`)
  }
}

/**
 * 更新照片的公开状态
 * @param {String} photoId - 照片ID
 * @param {Boolean} isPublic - 是否公开
 * @returns {Promise<MediaBase>} 更新后的照片记录
 */
const updatePhotoPublicStatus = async (photoId, isPublic) => {
  try {
    const photo = await PhotoModule.findByIdAndUpdate(photoId, { isPublic }, { new: true })
    return photo.toJSON()
  } catch (error) {
    throw new Error(`更新照片公开状态失败: ${error.message}`)
  }
}

/**
 * 更新视频的公开状态
 * @param {String} videoId - 视频ID
 * @param {Boolean} isPublic - 是否公开
 * @returns {Promise<MediaBase>} 更新后的视频记录
 */
const updateVideoPublicStatus = async (videoId, isPublic) => {
  try {
    const video = await VideoModule.findByIdAndUpdate(videoId, { isPublic }, { new: true })
    return video.toJSON()
  } catch (error) {
    throw new Error(`更新视频公开状态失败: ${error.message}`)
  }
}

module.exports = {
  createPhoto,
  createVideo,
  getUserPhotos,
  getUserVideos,
  softDeletePhoto,
  softDeleteVideo,
  updatePhotoPublicStatus,
  updateVideoPublicStatus,
}
