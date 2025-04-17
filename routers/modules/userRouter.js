const express = require('express')
const { formatResponse } = require('../../utils')
const { jsonParser } = require('../../middlewares')
const { validateRegistration, validationResult } = require('../../lib')

const router = express.Router()

router.post('/register', jsonParser, validateRegistration, (req, res) => {
  const verificationResults = validationResult(req)

  res.status(200).json(formatResponse(200, '注册成功', verificationResults))
})

module.exports = router
