const { validationResult, body, header } = require('express-validator')
const { formatResponse, verification } = require('../../utils')

/** 图片上传参数校验中间件 */
const validateUpload = [
  // token校验 必填
  header('Authorization')
    .notEmpty()
    .withMessage('token不能为空')
    .custom(async (token, { req }) => {
      // 自定义校验：检查token是否有效
      const decoded = await verification(token)
      req.user = decoded

      if (!decoded) {
        throw new Error('token失效')
      }
    }),

  // 检查所有校验结果
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json(formatResponse(0, '图片上传失败-参数错误', errors.array()))
    }
    next()
  },
]

module.exports = { validateUpload }
