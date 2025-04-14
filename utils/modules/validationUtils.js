/**
 * 参数校验工具
 * @param {object} params - 待校验的参数对象
 * @param {object} schema - 校验规则
 * @returns {{
 *   isValid: boolean,
 *   requiredErrors: string[],
 *   typeErrors: Array<{field: string, expected: string, actual: string}>,
 *   extraFields: string[]
 * }}
 */
const validateParams = (params = {}, schema = {}) => {
  const result = {
    isValid: true,
    requiredErrors: [],
    typeErrors: [],
    extraFields: [],
  }

  // 校验必填字段和类型
  Object.entries(schema).forEach(([field, rule]) => {
    const value = params[field]
    const isRequiredMissing = rule.required && (value === undefined || value === null)

    // 必填校验
    if (isRequiredMissing) {
      result.requiredErrors.push(field)
      result.isValid = false
    }

    // 类型校验（存在且非空时校验）
    if (!isRequiredMissing && value !== undefined && value !== null) {
      const actualType = getType(value)
      if (actualType !== rule.type) {
        result.typeErrors.push({
          field,
          expected: rule.type,
          actual: actualType,
        })
        result.isValid = false
      }
    }
  })

  // 检测多余字段
  Object.keys(params).forEach((field) => {
    if (!schema.hasOwnProperty(field)) {
      result.extraFields.push(field)
      result.isValid = false
    }
  })

  return result
}

/**
 * 获取精确的类型描述
 * @param {*} value - 需要检测的值
 * @returns {string} 类型字符串
 */
function getType(value) {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  if (value instanceof Date) return 'date'
  return typeof value
}

module.exports = validateParams

// 使用示例
// const schema = {
//   username: { required: true, type: 'string' },
//   age: { required: true, type: 'number' },
//   isAdmin: { required: false, type: 'boolean' },
// }

// const testParams = {
//   username: 'Alice',
//   age: '25', // 错误类型
//   gender: 'male', // 多余字段
// }

// const validation = validateParams(testParams, schema)

// console.log(validation)
/* 输出结果：
{
  isValid: false,
  requiredErrors: [],
  typeErrors: [
    { field: 'age', expected: 'number', actual: 'string' }
  ],
  extraFields: ['gender']
}
*/
