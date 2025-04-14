const dbConfig = {
  DBHOST: process.env.DBHOST || '127.0.0.1', // 数据库地址
  DBPORT: process.env.DBPORT || '27017', // 数据库端口
  DBNAME: process.env.DBNAME || 'blog', // 数据库名称
}

module.exports = dbConfig
