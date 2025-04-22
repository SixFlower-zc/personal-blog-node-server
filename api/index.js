const userAPI = require('./modules/userAPI')
const uploadAPI = require('./modules/uploadAPI')
const albumAPI = require('./modules/albumAPI')

module.exports = {
  ...userAPI,
  ...uploadAPI,
  ...albumAPI,
}
