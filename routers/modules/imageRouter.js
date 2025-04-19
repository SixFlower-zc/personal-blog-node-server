const express = require('express')
const path = require('path')
const fs = require('fs')
const sharp = require('sharp')
const router = express.Router()

// 导入配置
const { allowImageWidth, allowImageQuality } = require('../../config/appConfig')
const { formatResponse } = require('../../utils')

// 根目录
const rootDir = path.join(__dirname, '../..')
const cacheDir = path.join(rootDir, 'public/assets/cache')
// 创建上传目录
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true })
}

// !: 图片动态压缩接口
router.get('/:filename', async (req, res) => {
  const { filename } = req.params
  const { width = allowImageWidth[0], quality = allowImageQuality[0] } = req.query
  // 导入配置

  // 参数验证
  const parsedWidth = parseInt(width)
  const parsedQuality = parseInt(quality)

  // 图片宽度限制校验
  if (!allowImageWidth.includes(parsedWidth)) {
    return res.status(400).json(
      formatResponse(0, `无效的图片宽度参数,图片宽度必须为${allowImageWidth.join('、')}中的一个`, {
        allowImageWidth,
      })
    )
  }

  // 质量参数校验
  if (!allowImageQuality.includes(parsedQuality)) {
    return res.status(400).json(
      formatResponse(0, `无效的质量参数,质量参数必须为${allowImageQuality.join('、')}中的一个`, {
        allowImageQuality,
      })
    )
  }

  // 文件名验证
  if (filename.includes('..') || !/^original-/.test(filename)) {
    return res.status(403).json(forematResponse(0, '非法文件名', {}))
  }

  // 文件名解析
  const originalPath = path.join(rootDir, 'public/originals', filename)
  const cacheName = `${filename}-w${width}-q${quality}.webp`
  const cachePath = path.join(cacheDir, cacheName)

  try {
    // 检查原始文件
    if (!fs.existsSync(originalPath)) {
      return res.status(404).json(formatResponse(0, '文件不存在', {}))
    }

    // 如果缓存存在直接返回
    if (fs.existsSync(cachePath)) {
      return res.sendFile(cachePath)
    }

    // 测试目录写入权限
    try {
      await fs.promises.access(cacheDir, fs.constants.W_OK)
    } catch (err) {
      console.error('缓存目录无写入权限:', cacheDir)
      throw new Error('缓存目录无写入权限')
    }

    // 生成缓存文件
    try {
      const transformer = sharp(originalPath)

      // 先处理图片
      const buffer = await transformer
        .resize(width ? parseInt(width) : null)
        // 将图片转换为WebP格式，并设置WebP的压缩参数
        .webp({
          // 设置WebP格式的输出质量，取值范围为0-100，数值越高质量越高
          quality: parseInt(quality),
          // 设置WebP格式中透明通道的质量，取值范围为0-100，数值越高质量越高
          alphaQuality: parseInt(quality),
          // 设置是否以无损模式压缩图片，false表示有损模式，通常可以得到更好的压缩比
          lossless: false,
        })
        .toBuffer()

      // 再写入文件
      await fs.promises.writeFile(cachePath, buffer)

      // 返回生成的文件
      res.sendFile(cachePath)
    } catch (err) {
      console.error('图片处理具体错误:', err)
      throw err // 向上抛出错误
    }
  } catch (err) {
    console.error('动态压缩接口具体错误:', err)
    throw err // 向上抛出错误
  }
})

module.exports = router
