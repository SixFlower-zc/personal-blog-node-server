/**
 * 生成随机文件名
 * @param {string} extension 文件扩展名
 * @returns {string} 随机文件名
 */
const randomFileName = (extension = '') => {
  // 生成时间戳部分
  const timestamp = Date.now()

  // 生成6位随机字符串（包含小写字母和数字）
  const randomString = Math.random()
    .toString(36) // 转换为36进制字符串（包含字母和数字）
    .substring(2, 8) // 截取从第2位到第8位的字符（共6位）

  // 处理扩展名格式
  let formattedExtension = ''
  if (extension) {
    formattedExtension = extension.startsWith('.') ? extension : `.${extension}`
  }

  // 组合所有部分
  return `${timestamp}${randomString}${formattedExtension}`
}

module.exports = randomFileName

// 使用示例
// console.log(generateRandomFileName()) // 输出类似：1717666281234abc123
// console.log(generateRandomFileName('jpg')) // 输出类似：1717666281234abc123.jpg
// console.log(generateRandomFileName('.png')) // 输出类似：1717666281234abc123.png
