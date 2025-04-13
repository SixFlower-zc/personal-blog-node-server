const bodyParser = require('body-parser')

const jsonParser = bodyParser.json() // 解析json数据
const urlencodedParser = bodyParser.urlencoded({ extended: false }) //解析 x-www-form-urlencoded 数据

module.exports = {
  jsonParser,
  urlencodedParser,
}
