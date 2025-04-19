const redis = require('redis')

// 获取配置环境变量
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || ''
const REDIS_HOST = process.env.REDIS_HOST || 'localhost'
const REDIS_PORT = process.env.REDIS_PORT || 6379
const MAX_RETRIES = 5 // 最大重试次数

// 构建安全的Redis连接字符串
const authPart = REDIS_PASSWORD ? `:${encodeURIComponent(REDIS_PASSWORD)}@` : ''
const redisUrl = `redis://${authPart}${REDIS_HOST}:${REDIS_PORT}`
// console.log('Redis URL:', redisUrl)

// 创建Redis客户端
const client = redis.createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (attempts) => {
      console.log(`重试连接，当前尝试次数: ${attempts}`)

      if (attempts >= MAX_RETRIES) {
        console.log('已达到最大重试次数，停止重试')
        return false // 停止重试
      }

      // 指数退避策略，最大间隔3秒
      return Math.min(attempts * 100, 3000)
    },
  },
})

// 事件监听
client.on('connect', () => {
  console.log('Redis已连接')
})

client.on('ready', () => {
  console.log('Redis已准备好接收命令')
})

client.on('error', (error) => {
  if (error.code === 'ECONNREFUSED') {
    console.error('错误: 无法连接到Redis服务器')
  } else if (error.message.includes('WRONGPASS')) {
    console.error('错误: Redis认证失败，请检查密码')
  } else {
    console.error('Redis客户端错误:', error)
  }
})

client.on('end', () => {
  console.warn('Redis连接已关闭')
})

client.on('reconnecting', () => {
  console.log('正在尝试重新连接Redis...')
})

// 初始化连接
client
  .connect()
  .then(() => {
    console.log('Redis连接初始化成功')
    // 可以进行测试命令验证连接
    // return client.ping().then(res => console.log('Ping响应:', res))
  })
  .catch((error) => {
    console.error('Redis连接初始化失败:', error.message)
    process.exit(1)
  })

// 导出已配置的客户端
module.exports = client
