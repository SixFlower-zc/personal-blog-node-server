const dbConfig = {
  DBHOST: process.env.DBHOST || '127.0.0.1', // 数据库地址
  DBPORT: process.env.DBPORT || '27017', // 数据库端口
  DBNAME: process.env.DBNAME || 'blog', // 数据库名称
  DBUSER: process.env.DBUSER || 'root', // 数据库用户名
  DBPASS: process.env.DBPASS || '123456', // 数据库密码
}

module.exports = dbConfig
