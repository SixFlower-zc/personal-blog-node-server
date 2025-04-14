const express = require('express')
const appConfig = require('../../config/appConfig')

/**
 * 获取baseUrl
 * @param {express.Request } req 请求对象
 * @returns {string} baseUrl
 */
const getBaseUrl = (req) => {
  if (appConfig.useBodyUrl) {
    // 解析请求对象，获取协议、主机名、端口号
    const protocol = req.protocol
    const host = req.get('host')
    // 解析主机名，去掉端口号
    const hostname = host.split(':')[0]
    console.log(protocol, host.split(':')[0], host.split(':')[1])
    return `${protocol}://${hostname}`
  } else {
    return appConfig.base_url
  }
}

module.exports = getBaseUrl
