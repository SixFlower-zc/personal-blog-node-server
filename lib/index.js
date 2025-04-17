const { validationResult } = require('express-validator')
const userRule = require('./modules/userRule')

module.exports = {
  validationResult,
  ...userRule,
}
