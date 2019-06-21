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

/**
 * @description ublox设备数据解析，包含nmea，ublox，rtcm数据，同类型数据合并成一包
 * @param {Buffer} data
 */
const ublox = data => {
  let residual
  let nmeaFlag = []
  let nmea, ublox
  for (let i = 1; i < data.length; i++) {
    if (data[i - 1] === 0xb5 && data[i] === 0x62) {
      // self
      // 检测剩余长度是否足够，防止溢出
      if (i - 1 + 2 + 4 + 2 > data.length) {
        residual = Buffer.alloc(data.length - (i - 1))
        data.copy(residual, 0, i - 1, data.length)
        break
      }
      let length = data.readUInt16LE(i + 3)
      if (i - 1 + 6 + length + 2 > data.length) {
        residual = Buffer.alloc(data.length - (i - 1))
        data.copy(residual, 0, i - 1, data.length)
        break
      }
      if (
        checkSum(
          data[i + 1 + 4 + length],
          data[i + 1 + 4 + length + 1],
          data,
          i + 1,
          i + 1 + 4 + length
        )
      ) {
        let buf = Buffer.alloc(8 + length)
        data.copy(buf, 0, i - 1, i + 1 + 4 + length + 2)
        if (ublox) ublox = Buffer.concat([ublox, buf])
        else ublox = buf
        i += 1 + 4 + length + 2 - 1
      }
    } else if (data[i - 1] === 0x24 && data[i] === 0x47) {
      // nmea
      nmeaFlag.push(i - 1)
    }
  }
  // nmea process
  collection.forEach(nmeaFlag, value => {
    for (let i = value + 20; i < data.length; i++) {
      if (i > 100 + value) break // 一般长度不超过100
      if (data[i - 1] === 0x0d && data[i] === 0x0a && data[i - 3] === 0x37) {
        let buf = Buffer.alloc(i + 1 - value)
        data.copy(buf, 0, value, i + 1)
        if (nmea) nmea = Buffer.concat([nmea, buf])
        else nmea = buf
        break
      } else if (i === data.length - 1 && !residual) {
        residual = Buffer.alloc(data.length - value)
        data.copy(residual, 0, value, data.length)
      }
    }
  })
  return { data: [nmea, ublox], residual: residual }
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
