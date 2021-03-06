import { EventBus } from '../../lib/event';
import { parse } from '../../lib/parse';
const collection = require('lodash/collection');
const net = require('net-socket');
const SerialPort = require('serialport');
const moment = require('moment');
const state = {
  windowSize: { height: window.innerHeight, width: window.innerWidth },
  comNumber: 30,
  serialState: '未连接',
  serialIsDisabled: false,
  packageTime: 200,
  serialBaudrate: 9600,
  netState: '未开启',
  netIsDisabled: false,
  infos: [],
  displayState: '暂停'
};

let hex = true;
let ascii = false;
let timestamp = false;
let isDisplay = true;
const mutations = {
  WINDOW_SIZE(state, value) {
    state.windowSize = value;
  },
  SERIAL_STATE(state, value) {
    state.serialState = value;
    state.serialIsDisabled = value !== '未连接';
  },
  PACKAGE_TIME(state, value) {
    state.packageTime = value;
  },
  SERIAL_BAUDRATE(state, value) {
    state.serialBaudrate = value;
  },
  NET_STATE(state, value) {
    state.netState = value;
    state.netIsDisabled = value !== '未开启';
  },
  DISPLAY_STATE(state) {
    isDisplay = !isDisplay;
    state.displayState = isDisplay ? '暂停' : '开启';
  },
  DISPLAY_CLEAR(state) {
    state.infos = [];
  },
  DISPLAY_CONTENT(state, value) {
    if (!isDisplay) return;
    if (state.infos.length > 1000) state.infos = [];
    let now = '';
    if (timestamp) now = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    if (hex) {
      state.infos.push(
        `${value.type}-Hex[${now}]:  ${value.data.toString('hex')}`
      );
    }
    if (ascii) {
      state.infos.push(`${value.type}-Ascii[${now}]: ${value.data.toString()}`);
    }
  }
};

let port;
let socket;
let isConnect;
let sendInterval, reconnectInterval;
const actions = {
  actionWindowSize({ commit }, value) {
    commit('WINDOW_SIZE', value);
  },
  actionCheckedChange({ commit }, value) {
    if (value[0] === 'hex' || value[1] === 'hex' || value[2] === 'hex') {
      hex = true;
    } else hex = false;
    if (value[0] === 'ascii' || value[1] === 'ascii' || value[2] === 'ascii') {
      ascii = true;
    } else ascii = false;
    if (
      value[0] === 'timestamp' ||
      value[1] === 'timestamp' ||
      value[2] === 'timestamp'
    ) {
      timestamp = true;
    } else timestamp = false;
  },
  actionDisplayPause({ commit }) {
    commit('DISPLAY_STATE');
  },
  actionDisplayClear({ commit }) {
    commit('DISPLAY_CLEAR');
  },
  actionSerial({ commit, state }, value) {
    // 清除当前所有状态
    if (port && port.isOpen) port.close();
    clearInterval(sendInterval);
    clearInterval(reconnectInterval);
    if (state.serialState === '已连接') {
      commit('SERIAL_STATE', '未连接');
      return;
    }
    commit('SERIAL_BAUDRATE', value.baudRate);
    port = new SerialPort(value.port, {
      baudRate: value.baudRate,
      autoOpen: false
    });
    port.on('error', err => {
      EventBus.$emit('message-box', '串口错误：' + err);
      port.close();
      commit('SERIAL_STATE', '未连接');
    });
    port.open(err => {
      if (err) EventBus.$emit('message-box', '打开串口失败：' + err);
      else commit('SERIAL_STATE', '已连接');
    });
    // FIXME 10秒检查一次串口，防止掉线
    reconnectInterval = setInterval(() => {
      if (state.serialState !== '已连接') {
        clearInterval(reconnectInterval);
        return;
      }
      if (!port || !port.isOpen) {
        port = new SerialPort(
          value.port,
          {
            baudRate: value.baudRate
          },
          err => {
            if (err) EventBus.$emit('message-box', '串口重连错误：' + err);
          }
        );
      }
    }, 30 * 1000);
    let data;
    sendInterval = setInterval(() => {
      if (!port || !port.isOpen) return;
      let msg = port.read();
      if (msg) {
        if (data) data = Buffer.concat([data, msg]);
        else data = msg;
      }
      if (isConnect && data && (!msg || data.length > 1024)) {
        let ret = parse(value.dataType, data); // FIXME 循环解析方法
        // 剩余长度部分,超时剩余部分清空
        if (msg) data = ret.residual;
        else data = null;
        collection.forEach(ret.data, (value, key) => {
          if (value) {
            setTimeout(() => {
              socket.write(value, err => {
                if (err) console.error(`socket write:${err}`);
                else commit('DISPLAY_CONTENT', { type: 'Send', data: value });
              });
            }, key * 20); // 延时，保证每包数据独立发送
          }
        });
      } else if (data && data.length > 2048) data = null;
    }, value.packageTime);
  },
  actionNet({ commit, state }, value) {
    if (state.netState === '已开启') {
      isConnect = false;
      socket.destroy();
      commit('NET_STATE', '未开启');
      return;
    }
    commit('NET_STATE', '已开启');
    socket = net.connect(Number(value.casterPort), value.casterIp); // reconnect
    socket.on('data', data => {
      if (isConnect) {
        if (port && port.isOpen) {
          port.write(data, err => {
            if (err) console.error(`port write:${err}`);
            else commit('DISPLAY_CONTENT', { type: 'Receive', data: data });
          });
        }
      } else {
        if (data.toString().includes('ICY 200 OK')) {
          isConnect = true;
          EventBus.$emit('message-box', '连接服务器成功');
        } else {
          isConnect = false;
          EventBus.$emit('message-box', `连接服务器失败:${data.toString()}`);
        }
      }
    });
    socket.on('close', () => {
      isConnect = false;
    });
    socket.on('connect', () => {
      socket.write(`SOURCE ${value.password} ${value.mountpoint}\r\n`);
    });
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions
};
