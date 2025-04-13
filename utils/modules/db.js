// 导入 mongoose 模块
const mongoose = require('mongoose')
const { DBHOST, DBPORT, DBNAME } = require('../../config/dbConfig')

/**
 * 连接数据库
 * @param {()=>void} success 数据库连接成功的回调函数
 * @param {(err:Error)=>void} error 数据库连接失败的回调函数
 * @param {()=>void} close 数据库连接关闭的回调函数
 */
const db = (
  success = () => {
    console.log('数据库连接成功')
  },
  error = (err) => {
    console.log('数据库连接失败', err)
  },
  close = () => {
    console.log('数据库连接已关闭')
  }
) => {
  // 连接数据库, test 是数据库名称(如果不存在,会自动创建)
  mongoose.connect(`mongodb://${DBHOST}:${DBPORT}/${DBNAME}`)

  // 设置连接成功的回调
  mongoose.connection.once('open', () => {
    success()
  })

  // 设置连接失败的回调
  mongoose.connection.on('error', (err) => {
    error(err)
  })

  // 设置连接关闭的回调
  mongoose.connection.on('close', () => {
    close()
  })
}

module.exports = db
