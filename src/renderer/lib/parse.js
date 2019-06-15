const collection = require('lodash/collection')
exports.parse = (type, data) => {
  switch (type) {
    case 'ublox':
      data = ublox(data)
      break
    default:
      data = { residual: null, data: [data] }
      break
  }
  return data
}

const ublox = data => {
  let ret = []
  let residual
  let nmea = []
  for (let i = 0; i < data.length; i++) {
    if (data[i - 1] === 0xb5 && data[i] === 0x62) {
      // self
      try {
        let length = data.readUInt16LE(i + 3)
        if (
          checkSum(
            data[i + 5 + length],
            data[i + 5 + length + 1],
            data,
            i + 1,
            i + 5 + length
          )
        ) {
          let buf = Buffer.alloc(8 + length)
          data.copy(buf, 0, i - 1, i + 5 + length + 2)
          ret.push(buf)
        }
      } catch (error) {
        // 溢出处理
        residual = Buffer.alloc(data.length - i - 1)
        data.copy(residual, 0, i - 1, data.length)
      }
    } else if (data[i - 1] === 0x24 && data[i] === 0x47) {
      // nmea
      nmea.push(i)
    }
  }
  collection.forEach(nmea, value => {
    for (let i = value + 20; i < data.length; i++) {
      if (i > 100) break
      if (data[i - 1] === 0x0d && data[i] === 0x0a && data[i - 3] === 0x37) {
        let buf = Buffer.alloc(i - value)
        data.copy(buf, 0, value, i)
        ret.push(buf)
        break
      }
      if (i === data.length - 1 && !residual) {
        residual = Buffer.alloc(i - value)
        data.copy(residual, 0, value, i)
      }
    }
  })
  return { data: ret, residual: residual }
}

/**
 * @description 数据校验
 * @param {Byte} checkA
 * @param {Byte} checkB
 * @param {Buffer} data
 * @param {Number} start
 * @param {Number} end
 * @returns {Boolean} res
 */
const checkSum = (checkA, checkB, data, start, end) => {
  let ckA = 0x00
  let ckB = 0x00
  for (let i = start; i < end; i++) {
    ckA = ckA + data[i]
    ckB = ckB + ckA
  }
  if (checkA === (ckA & 0xff) && checkB === (ckB & 0xff)) return true
  else return false
}
