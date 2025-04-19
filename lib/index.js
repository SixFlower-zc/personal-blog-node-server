const userRule = require('./modules/userRule')
const uploadRule = require('./modules/uploadRule')

module.exports = {
  ...userRule,
  ...uploadRule,
}
