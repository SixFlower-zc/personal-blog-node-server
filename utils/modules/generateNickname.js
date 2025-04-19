/**
 * 生成随机昵称
 * @returns {string} 随机昵称
 */
const generateNickname = () => {
  const adjectives = ['快乐', '勇敢', '智慧', '善良', '神秘', '可爱', '坚强', '乐观']
  const nouns = ['小星', '小猫', '小狗', '小兔', '小鱼', '小鸟', '小鹿', '小熊']

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]

  // 生成随机的数字和字母组合
  const randomChars = Math.random().toString(32).substring(10, 20) // 生成随机字符

  return `${adjective}${noun}${randomChars}`
}

module.exports = generateNickname
