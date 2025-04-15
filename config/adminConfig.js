const adminConfig = {
  role: [
    {
      name: 'admin', //普通管理员
      value: 0,
      routes: [
        {
          path: '/admin',
          name: 'home',
          icon: 'home',
          component: 'Home',
        },
      ],
    },
    {
      name: 'superAdmin', //超级管理员
      value: 1,
      routes: [
        {
          path: '/admin',
          name: 'home',
          icon: 'home',
          component: 'Home',
        },
      ],
    },
  ], // 管理员权限等级与不同等级的权限路由定义,角色创建时默认为第一个角色
}

module.exports = adminConfig
