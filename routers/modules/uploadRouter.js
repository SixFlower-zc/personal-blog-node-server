// 库和模块引入
const express = require('express')
const path = require('path')
const fs = require('fs')
const { formidable } = require('formidable')

// 工具函数
const { getBaseUrl, randomFileName } = require('../../utils')

// 引入配置
const {
  maxImageSize,
  maxVideoSize,
  allowImageExt,
  allowVideoExt,
} = require('../../config/appConfig')

const router = express.Router()

// 使用项目根目录的路径
const rootDir = path.join(__dirname, '../..')
const originalsDir = path.join(rootDir, 'public/originals')
const videosDir = path.join(rootDir, 'public/assets/videos')

// 创建上传目录
if (!fs.existsSync(originalsDir)) {
  fs.mkdirSync(originalsDir, { recursive: true })
}
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true })
}

/* 上传图片接口 */
router.post('/image', (req, res) => {
  const baseUrl = getBaseUrl(req)

  const form = formidable({
    uploadDir: originalsDir, // 上传文件保存路径
    keepExtensions: true, // 保留原始文件扩展名
    maxFileSize: maxImageSize,
    filter: (part) => {
      // 增强文件类型白名单
      const allowedTypes = allowImageExt.map((ext) => `image/${ext}`) // 可选扩展类型
      return part.mimetype && allowedTypes.includes(part.mimetype)
    }, // 过滤文件类型
    filename: (name, ext) => {
      return `original-${randomFileName(ext)}`
    }, // 自定义文件名
  })

  form.parse(req, (err, fields, files) => {
    if (err) {
      // 上传失败
      return res.status(500).json({ error: '上传失败', details: err.message })
    }

    // 如果没有上传文件
    if (!files.file) {
      return res
        .status(400)
        .send(`没有上传文件，请检查上传文件类型是否为${allowImageExt.join('、')}`)
    }

    // 拼接并返回用户需要访问文件时的 URL
    // img 字段对应上传文件的名称,即发起上传请求时的键名
    const url = files.file.map((file) => {
      //! 拼接图片 URL images 对应路由
      const fileUrl = baseUrl + '/images/' + file.newFilename

      return {
        filename: file.newFilename,
        url: fileUrl,
      }
    })
    return res.status(200).send({ url })
  })
})

// 上传视频接口
router.post('/video', (req, res) => {
  const baseUrl = getBaseUrl(req)

  const form = formidable({
    uploadDir: videosDir,
    keepExtensions: true,
    maxFileSize: maxVideoSize,
    filter: (part) => {
      // 增强文件类型白名单
      const allowedTypes = allowVideoExt.map((ext) => `video/${ext}`) // 可选扩展类型

      // 类型错误处理
      if (!allowedTypes.includes(part.mimetype)) {
        return false
      }

      return part.mimetype && allowedTypes.includes(part.mimetype)
    }, // 过滤文件类型
    filename: (name, ext) => {
      return `${randomFileName(ext)}`
    },
  })

  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: '上传失败', details: err.message })
    }

    // 如果没有上传文件
    if (!files.file) {
      return res
        .status(400)
        .send(`没有上传文件，请检查上传文件类型是否为${allowVideoExt.join('、')}`)
    }

    // 拼接并返回用户需要访问文件时的 URL
    // img 字段对应上传文件的名称,即发起上传请求时的键名
    const url = files.file.map((file) => baseUrl + '/videos/' + file.newFilename)
    return res.status(200).send({ url })
  })
})

module.exports = router
