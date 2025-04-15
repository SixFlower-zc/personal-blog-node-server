// 文档在创建时自动将create_time和update_time字段设置为当前时间，文档更新时自动更新update_time字段
const timestampOptions = {
  createdAt: 'create_time',
  updatedAt: 'update_time',
}

// 文档在查询普通对象时，将返回的字段中不包含虚拟字段
const toObjectOptions = {
  virtuals: true, // 包含虚拟字段
  transform: (doc, ret) => {
    // 如果文档已经进行虚拟删除，则返回 null
    if (ret.isDeleted) {
      return null
    }

    // 显式将_id转换为id字段
    ret.id = ret._id.toString() // 显式添加 id 字段
    delete ret._id // 可选：删除 _id（根据需求）
    return ret
  },
}

// 文档在查询json对象时，将返回的字段中包含虚拟字段
const toJSONOptions = {
  virtuals: true,
  transform: (doc, ret) => {
    if (ret.isDeleted) {
      return null
    }

    ret.id = ret._id.toString()
    delete ret._id
    return ret
  },
}

// 其他配置选项介绍
const otherOptions = {
  minimize: false, // 禁用移除未定义字段的行为
  versionKey: false, // 禁用 __v 版本字段
  strict: false, // 允许保存未在 Schema 中定义的字段
  autoIndex: false, // 禁用自动创建索引的行为
  id: false, // 禁用自动生成的 id 虚拟字段
  runSettersOnQuery: true, // 在查询时运行设置器函数
  useNestedStrict: true, // 在嵌套对象上使用严格的字段验证
  selectPopulatedPaths: false, // 查询时不包含通过 populate 方法关联的字段
  collection: 'custom_collection_name', // 指定使用的集合名称
}
