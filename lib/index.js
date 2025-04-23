const userRule = require('./modules/userRule')
const uploadRule = require('./modules/uploadRule')
const AdminRule = require('./modules/AdminRule')
const albumRule = require('./modules/albumRule')
const docRule = require('./modules/docRule')
const projectRule = require('./modules/projectRule')

module.exports = {
  ...userRule,
  ...uploadRule,
  ...AdminRule,
  ...albumRule,
  ...docRule,
  ...projectRule,
}
