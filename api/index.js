const userAPI = require('./modules/userAPI')
const uploadAPI = require('./modules/uploadAPI')
const albumAPI = require('./modules/albumAPI')
const projectAPI = require('./modules/projectAPI')
const docAPI = require('./modules/docAPI')
const AdminAPI = require('./modules/AdminAPI')
const AdminLogAPI = require('./modules/AdminLogAPI')

module.exports = {
  ...userAPI,
  ...uploadAPI,
  ...docAPI,
  ...AdminAPI,
  ...AdminLogAPI,
  ...albumAPI,
  ...projectAPI,
}
