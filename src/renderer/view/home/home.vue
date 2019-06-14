<template>
  <div>
    <Row class="home-row">
      <Col>
        Serial:
        <AutoComplete
          :disabled="serialIsDisabled"
          v-model="comSelected"
          :data="coms"
          placeholder="COM"
          style="width:60px"
        ></AutoComplete>
        <Divider type="vertical"/>
        <span>
          Baudrate:
          <Input :disabled="serialIsDisabled" v-model="baudRate" style="width: 60px"/>
        </span>
        <Divider type="vertical"/>
        <span>
          Interval(ms):
          <Input :disabled="serialIsDisabled" v-model="packageTime" style="width: 60px"/>
        </span>
        <Divider type="vertical"/>Type:
        <AutoComplete
          :disabled="netIsDisabled"
          v-model="dataType"
          :data="dataTypes"
          placeholder="Data Type"
          style="width:80px"
        ></AutoComplete>
        <Button
          type="primary"
          style="float: right; margin-right: 5px;"
          @click="handleSerial"
        >{{serialState}}</Button>
      </Col>
    </Row>
    <Row class="home-row">
      <Col>
        Caster Address:
        <AutoComplete
          :disabled="netIsDisabled"
          v-model="casterIp"
          :data="casterIps"
          placeholder="Caster IP"
          style="width:120px"
        ></AutoComplete>
        <Divider type="vertical"/>
        <Input :disabled="netIsDisabled" v-model="casterPort" style="width: 60px"/>
        <Button
          type="primary"
          style="float: right; margin-right: 5px;"
          @click="handleNet"
        >{{netState}}</Button>
      </Col>
      <Col style="margin-top: 5px">
        Mountpoint:
        <Input :disabled="netIsDisabled" v-model="mountpoint" style="width: 100px"/>
        <Divider type="vertical"/>User-ID:
        <Input :disabled="netIsDisabled" v-model="userId" style="width: 100px"/>
        <Divider type="vertical"/>Password:
        <Input :disabled="netIsDisabled" v-model="password" style="width: 100px"/>
      </Col>
    </Row>
    <Row class="home-row">
      <Col style="height: 30px;">
        <span style="float: left; margin-left: 10px;margin-top: 5px;">
          <CheckboxGroup
            v-model="checkedDisplay"
            @on-change="checkedChange"
            style=" display: inline;"
          >
            <Checkbox label="hex">Hex</Checkbox>
            <Checkbox label="ascii">Ascii</Checkbox>
            <Checkbox label="timestamp">Timestamp</Checkbox>
          </CheckboxGroup>
        </span>
        <span style=" float: right; margin-right: 5px;">
          <Button type="success" @click="displayPause">{{displayState}}</Button>
          <Button style="margin-left: 10px;" type="warning" @click="displayClear">清空</Button>
        </span>
      </Col>
    </Row>
    <Row style=" position: fixed;">
      <Col
        id="infos-display"
        :style="{wordWrap: 'break-word',wordBreak: 'break-all',padding:'5px',overflow: 'auto',height:windowSize.height-130+'px',width:windowSize.width+'px'}"
      >
        <p style="font-size: 15px;" v-for="item in infos" :key="item.id">{{ item }}</p>
      </Col>
    </Row>
  </div>
</template>

<script src="./home.js">
</script>

<style scoped src="./home.css">
</style>

