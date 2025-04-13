const cron = require('node-cron')

/**
 * 初始化定时任务
 */
const initCronJobs = () => {
  // 定时任务（每天凌晨3点）
  cron.schedule('0 3 * * *', async () => {
    console.log('定时任务触发')
  })
}

module.exports = initCronJobs
