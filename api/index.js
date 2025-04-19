const userAPI = require('./modules/userAPI')
const uploadAPI = require('./modules/uploadAPI')

module.exports = {
  ...userAPI,
  ...uploadAPI,
}
