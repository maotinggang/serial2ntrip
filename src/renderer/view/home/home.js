import { mapState, mapActions } from 'vuex'
import { EventBus } from '@/lib/event'
const collection = require('lodash/collection')
const SerialPort = require('serialport')
const os = require('os')
export default {
  name: 'home',
  data() {
    return {
      comSelected: 'COM1',
      coms: [],
      baudRate: 9600,
      baudRates: [4800, 9600, 115200],
      packageTime: 100,
      packageTimes: [50, 100, 200, 500, 1000],
      dataTypes: ['ublox'],
      dataType: 'ublox',
      casterIp: '47.92.151.105',
      // casterIp: '127.0.0.1',
      casterIps: ['47.92.151.105'],
      casterPort: 8010,
      mountpoint: 'nanjing',
      userId: '',
      password: '12345678',
      checkedDisplay: ['hex']
    }
  },
  watch: {
    // 使用箭头函数时this无法识别
    infosChange: function() {
      this.$nextTick(() => {
        let infosArea = document.getElementById('infos-display')
        infosArea.scrollTop = infosArea.scrollHeight
      })
    }
  },
  created() {
    // 获取COM
    setInterval(() => {
      SerialPort.list().then(res => {
        this.coms = []
        collection.forEach(res, value => {
          this.coms.push(value.comName)
        })
      })
    }, 3000)
    // 读取ip
    let netParams = os.networkInterfaces()
    collection.forEach(netParams, value => {
      let temp = collection.filter(value, { family: 'IPv4' })
      if (temp[0].address) this.casterIps.push(temp[0].address)
    })
    // 监听错误事件
    EventBus.$on('message-box', value => {
      this.$Message.warning({
        content: value,
        duration: 5
      })
    })
    // 监听窗口尺寸变化
    window.onresize = () => {
      this.actionWindowSize({
        height: window.innerHeight,
        width: window.innerWidth
      })
    }
    window.onload = () => {
      this.actionWindowSize({
        height: window.innerHeight,
        width: window.innerWidth
      })
    }
  },
  computed: {
    ...mapState('home', [
      'comNumber',
      'windowSize',
      'serialState',
      'serialIsDisabled',
      'netState',
      'netIsDisabled',
      'displayState',
      'infos'
    ]),
    infosChange() {
      return this.infos
    }
  },
  methods: {
    ...mapActions('home', [
      'actionCheckedChange',
      'actionDisplayPause',
      'actionDisplayClear',
      'actionWindowSize',
      'actionSerial',
      'actionNet'
    ]),
    handleSerial() {
      if (!this.comSelected || !this.baudRate || !this.packageTime) {
        this.$Message.warning('请填写串口参数')
        return
      }
      this.actionSerial({
        port: this.comSelected,
        baudRate: Number(this.baudRate),
        packageTime: Number(this.packageTime) < 50 ? 50 : this.packageTime,
        dataType: this.dataType
      })
    },
    handleNet() {
      if (!this.casterIp || !this.casterPort || !this.mountpoint) {
        this.$Message.warning('请填写服务器参数')
        return
      }
      this.actionNet({
        casterIp: this.casterIp,
        casterPort: this.casterPort,
        mountpoint: this.mountpoint,
        userId: this.userId,
        password: this.password
      })
    },
    checkedChange(value) {
      this.actionCheckedChange(value)
    },
    displayPause() {
      this.actionDisplayPause()
    },
    displayClear() {
      this.actionDisplayClear()
    }
  }
}
