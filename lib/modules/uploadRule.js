const { validationResult, header } = require('express-validator')
const { formatResponse } = require('../../utils')
const { userAuthorizationUtil } = require('../authorizationUtil')

/** 图片上传参数校验中间件 */
const validateUpload = [
  // token校验 必填
  header('Authorization')
    .notEmpty()
    .withMessage('token不能为空')
    .custom(async (token, { req }) => {
      // 普通用户token校验并处理token
      await userAuthorizationUtil(token, req)
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
