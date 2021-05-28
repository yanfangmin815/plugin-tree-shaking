const fs = require('fs')
const path = require('path')

const statisticsTimes = (arr, key) => {
  let newArr = arr.reduce((pre,next) => {
    pre[next] ? pre[next]++ : pre[next] = 1
    return pre
  },{})
  return newArr[key]
}

let vars = ['err', 'log', 'console']

module.exports = {
  statisticsTimes,
  vars
}