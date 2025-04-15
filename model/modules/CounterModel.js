const { Schema, model } = require('mongoose')

// 创建一个计数器集合
const counterSchema = new Schema({
  name: { type: String, required: true, index: true },
  seq: { type: Number, default: 0 },
})

const CounterModel = model('counters', counterSchema)

module.exports = CounterModel
