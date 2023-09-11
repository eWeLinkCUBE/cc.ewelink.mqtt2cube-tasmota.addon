import _ from 'lodash';
import logger from "../log";
import { v4 as uuid } from 'uuid';
import { getMQTTClient } from "../ts/class/mqtt";
import EDeviceType from "../ts/enum/EDeviceType";
import { IDiscoveryMsg, ISetOptions } from "../ts/interface/IDiscoveryMsg";
import { IMqttReceiveEvent, IStateTopic } from "../ts/interface/IMqtt";
import { INotSupport } from "../ts/interface/INotSupport";
import { initByDiscoveryMsg } from "./initByDiscoveryMsg";
import { TDeviceSetting, getDeviceSettingList, updateDeviceSettingList } from "./tmp";
import { getIHostSyncDeviceList, syncDeviceOnlineToIHost, syncDeviceStateToIHost } from '../cube-api/api';
import { checkTasmotaDeviceInIHost } from './device';
import { IState, ISwitch } from '../ts/interface/ISwitch';
import SSE from '../ts/class/sse';
import ESseEvent from '../ts/enum/ESseEvent';

const DEVICE_TYPE_TO_FUNC_MAPPING = {
    [EDeviceType.SWITCH]: handleSwitchMQTTMsg,
    [EDeviceType.UNKNOWN]: handleUnknownMQTTMsg,
}


/**
 * @description 重新对设备的 MQTT topic做一次订阅/取消订阅
 * @param {TDeviceSetting} newDeviceSetting
 * @param {TDeviceSetting} [oldDeviceSetting]
 */
async function resubscribeMQTTTopic(newDeviceSetting: TDeviceSetting, oldDeviceSetting?: TDeviceSetting) {
    // 旧 setting 存在则取消订阅相关topic
    if (oldDeviceSetting) {
        logger.info(`[resubscribeMQTTTopic] unsubscribing topic`);
        await unsubscribeAllTopic(oldDeviceSetting);
    }

    // 订阅新设备的所有topic
    logger.info(`[resubscribeMQTTTopic] subscribing topic`);
    await subscribeAllTopic(newDeviceSetting);
}


/**
 * @description 处理收到的MQTT消息
 * @param {IMqttReceiveEvent<any>} eventData
 * @returns {*} 
 */
async function handleMQTTReceiveMsg(eventData: IMqttReceiveEvent<any>) {
    try {
        logger.info(`[handleMQTTReceiveMsg] topic ${eventData.topic} receive msg => ${typeof eventData.data === 'string' ? eventData.data : JSON.stringify(eventData.data)}`);
        const { topic } = eventData;

        // 处理discovery信息
        if (isDiscoveryMsg(topic)) {
            await initByDiscoveryMsg(eventData as IMqttReceiveEvent<IDiscoveryMsg>);
            return;
        }

        // 根据对应的设备类别调用对应的处理方法
        const deviceSettingList = getDeviceSettingList();
        for (const deviceSetting of deviceSettingList) {
            const func = _.get(DEVICE_TYPE_TO_FUNC_MAPPING, deviceSetting.display_category);
            if (!func) return;
            await func(eventData, deviceSetting);
        }
    } catch (err) {
        logger.error(`[handleMQTTReceiveMsg] handle MQTT receive message error: ${err}`);
    }
}


/**
 * @description 处理SWITCH类设备的消息
 * @param {IMqttReceiveEvent<any>} eventData
 * @param {TDeviceSetting} deviceSetting
 * @returns {*} 
 */
async function handleSwitchMQTTMsg(eventData: IMqttReceiveEvent<any>, deviceSetting: TDeviceSetting): Promise<void> {
    logger.info(`[handleSwitchMQTTMsg] handling switch ${JSON.stringify(eventData)}`);
    if (deviceSetting.display_category !== EDeviceType.SWITCH) return;
    const { topic } = eventData;
    const { mqttTopics: { state_topic, result_topic, availability_topic, power_topics, state_topic_all }, so } = deviceSetting;


    // 处理在线离线
    if (topic.toLowerCase() === availability_topic.toLowerCase()) {
        await handleDeviceOnlineOffline(eventData, deviceSetting);
        return;
    }

    // 处理setOption变化事件
    const isSetOptionChanged = topic.toLowerCase().includes('setoption');

    // 如果topic已经包含SetOption代表setOption4已开但缓存未更新/setOption4需要特殊处理
    if (isSetOptionChanged || so["4"] === 1) {
        logger.info(`[handleSwitchMQTTMsg] handle setOption 4`)
        // 处理power事件
        const powerOrStateTopic = power_topics.includes(topic) || `${state_topic_all}STATE` === topic;
        if (powerOrStateTopic) {
            await handleSwitchPower(eventData, deviceSetting);
            return;
        }


        if (isSetOptionChanged) {
            handleSetOptionChange(eventData, deviceSetting);
            return;
        }

        return;
    }

    if (topic.toLowerCase() === state_topic.toLowerCase() || topic.toLowerCase() === result_topic.toLowerCase()) {
        logger.info(`[handleSwitchMQTTMsg] here is state topic ${eventData.topic}`);
        if (typeof eventData.data === 'string') return;

        // 处理POWER事件
        const isPowerTopic = isCertainTopic(eventData.data, 'power');
        if (isPowerTopic) {
            await handleSwitchPower(eventData, deviceSetting);
        }

        // 处理setOption变化事件
        const isSetOptionChanged = isCertainTopic(eventData.data, 'setOption');
        if (isSetOptionChanged) {
            handleSetOptionChange(eventData, deviceSetting);
        }

        return;
    }
}



/**
 * @description 处理不支持设备的消息
 * @param {IMqttReceiveEvent<any>} eventData
 * @param {TDeviceSetting} deviceSetting
 * @returns {*} 
 */
function handleUnknownMQTTMsg(eventData: IMqttReceiveEvent<any>, deviceSetting: TDeviceSetting) {
    const { topic, data } = eventData;
    const { mqttTopics: { availability_topic, availability_online } } = deviceSetting as INotSupport;
    const deviceSettingList = getDeviceSettingList();
    if (topic.toLowerCase() === availability_topic.toLowerCase()) {
        deviceSetting.online = data === availability_online;
        const curIdx = deviceSettingList.findIndex(curDeviceSetting => curDeviceSetting.mac === deviceSetting.mac);
        deviceSettingList[curIdx] = deviceSetting;
        updateDeviceSettingList(deviceSettingList);
        return;
    }

    return;
}


/**
 * @description 判断是否为 discovery topic
 * @param {string} [topic='']
 * @returns {*}  {boolean}
 */
function isDiscoveryMsg(topic = ''): boolean {
    let topicComponents = topic.split('/');
    return topicComponents[0] === 'tasmota'
        && topicComponents[1] === 'discovery'
        && topicComponents[3] === 'config';
}


/**
 * @description 订阅该设备下的所有主题
 * @param {TDeviceSetting} deviceSetting
 * @returns {*}  {Promise<void>}
 */
async function subscribeAllTopic(deviceSetting: TDeviceSetting): Promise<void> {
    const mqttClient = await getMQTTClient();
    if (!mqttClient) {
        logger.error(`[subscribeAllTopic] mqttClient doesn't exist. => ${mqttClient}`);
        return;
    }

    if (deviceSetting.display_category === EDeviceType.SWITCH) {
        const { mqttTopics } = deviceSetting
        const { state_topic, availability_topic, power_topics, state_topic_all } = mqttTopics;
        mqttClient.subscribe(state_topic);
        // mqttClient.subscribe(result_topic);
        mqttClient.subscribe(availability_topic);
        mqttClient.subscribe(state_topic_all);
        power_topics.forEach(topic => mqttClient.subscribe(topic));
    }

    if (deviceSetting.display_category === EDeviceType.UNKNOWN) {
        const { mqttTopics } = deviceSetting
        const { availability_topic } = mqttTopics;
        mqttClient.subscribe(availability_topic);
    }
}


/**
 * @description 取消订阅该设备下的所有主题
 * @param {TDeviceSetting} deviceSetting
 * @returns {*}  {Promise<void>}
 */
async function unsubscribeAllTopic(deviceSetting: TDeviceSetting): Promise<void> {
    const mqttClient = await getMQTTClient()
    if (!mqttClient) {
        logger.error(`[unsubscribeAllTopic] mqttClient doesn't exist. => ${mqttClient}`);
        return;
    }

    if (deviceSetting.display_category === EDeviceType.SWITCH) {
        const { mqttTopics } = deviceSetting
        const { state_topic, availability_topic, power_topics, state_topic_all } = mqttTopics;
        mqttClient.unsubscribe(state_topic);
        // mqttClient.unsubscribe(result_topic);
        mqttClient.unsubscribe(availability_topic);
        mqttClient.unsubscribe(state_topic_all);
        power_topics.forEach(topic => mqttClient.unsubscribe(topic));
    }

    if (deviceSetting.display_category === EDeviceType.UNKNOWN) {
        const { mqttTopics } = deviceSetting
        const { availability_topic } = mqttTopics;
        mqttClient.unsubscribe(availability_topic);
    }
}


async function handleSwitchPower(eventData: IMqttReceiveEvent<any>, deviceSetting: ISwitch) {
    logger.info(`[handleSwitchMQTTMsg] handle switch power`);
    const { mqttTopics: { state_power_on, state_power_off }, capabilities } = deviceSetting;
    const toggleCount = capabilities.filter(capability => capability.capability === 'toggle').length;
    const channelLength = toggleCount === 0 ? 1 : toggleCount;
    // logger.info(`[handleSwitchPower] channelLength => ${channelLength}, ${JSON.stringify(eventData)}`);

    const { topic } = eventData;

    // POWER topic会发送两个回复，一个为JSON格式，一个为字符串格式，不需要重复处理
    // 另外考虑到setOption90会禁止MQTT消息以非JSON的格式发送，所以此处直接跳过对字符串回复的处理，仅处理JSON格式
    if (typeof eventData.data === 'string') {
        logger.info(`[handleSwitchPower] topic ${topic} receiving repeat power message ${JSON.stringify(eventData)}, ignore it`);
        return;
    }


    // 1. 生成更新内容
    let state: {} | IState = {};
    const payload = eventData.data;

    // 根据单通道与多通道生成更新所需的state
    if (channelLength === 1) {
        const power = payload.POWER === state_power_on ? "on" : "off";
        deviceSetting.state.power.powerState = power;
        state = {
            power: {
                powerState: power
            }
        };
    } else {
        for (let i = 1; i <= channelLength; i++) {
            const key = `POWER${i}` as keyof IStateTopic;
            const value = payload[key];
            // if (powerString !== key) continue;
            const validState = [state_power_on, state_power_off].includes(value);
            if (!validState) continue;
            const power = value === state_power_on ? 'on' : 'off'
            deviceSetting.state.toggle![i].toggleState = power;
            const toggle: IState = _.get(state, ['toggle'], {})
            _.assign(toggle, {
                [i]: {
                    toggleState: power
                }
            })

            state = { toggle }
        }
    }

    // 对不上的设备无需继续操作
    if (_.isEmpty(state)) return;

    // 2. 更新缓存数据
    const deviceSettingList = getDeviceSettingList();
    const curIdx = deviceSettingList.findIndex(curDeviceSetting => curDeviceSetting.mac === deviceSetting.mac);
    deviceSettingList[curIdx] = deviceSetting;
    updateDeviceSettingList(deviceSettingList);

    // 3. 同步到iHost
    const res = await getIHostSyncDeviceList();
    if (res.error !== 0) {
        logger.error(`[handleSwitchPower] get iHost device error => ${JSON.stringify(res)}`)
        return;
    }

    const deviceList = res.data!.device_list;
    if (checkTasmotaDeviceInIHost(deviceList, deviceSetting.mac)) {
        const curDevice = deviceList.find(device => JSON.stringify(device.tags).includes(deviceSetting.mac));
        const params = {
            event: {
                header: {
                    name: 'DeviceStatesChangeReport',
                    message_id: uuid(),
                    version: '1',
                },
                endpoint: {
                    serial_number: curDevice!.serial_number,
                    third_serial_number: deviceSetting.mac,
                },
                payload: {
                    state
                },
            },
        }
        const syncRes = await syncDeviceStateToIHost(params);
        logger.info(`[handleSwitchPower] device state sync to iHost result ${JSON.stringify(syncRes)}`);
    }
}


async function handleDeviceOnlineOffline(eventData: IMqttReceiveEvent<any>, deviceSetting: TDeviceSetting) {
    logger.info(`[handleSwitchMQTTMsg] handling offline message: ${eventData.topic}`);
    const deviceSettingList = getDeviceSettingList();
    const { mqttTopics: { availability_online }, mac } = deviceSetting;
    const online = eventData.data === availability_online;
    deviceSetting.online = online;

    // 更新到缓存中
    const curIdx = deviceSettingList.findIndex(curDeviceSetting => curDeviceSetting.mac === deviceSetting.mac);
    deviceSettingList[curIdx] = deviceSetting;
    updateDeviceSettingList(deviceSettingList);

    // 发送SSE告知前端
    SSE.send({
        name: ESseEvent.DEVICE_ONLINE_STATUS_REPORT,
        data: {
            deviceId: mac,
            online
        }
    })


    // 将离线状态同步到iHost
    const res = await getIHostSyncDeviceList();
    if (res.error !== 0) {
        logger.error(`[handleSwitchMQTTMsg] get iHost device error => ${JSON.stringify(res)}`)
        return;
    }

    const deviceList = res.data!.device_list;
    if (checkTasmotaDeviceInIHost(deviceList, deviceSetting.mac)) {
        const curDevice = deviceList.find(device => JSON.stringify(device.tags).includes(deviceSetting.mac));
        const params = {
            event: {
                header: {
                    name: 'DeviceOnlineChangeReport',
                    message_id: uuid(),
                    version: '1',
                },
                endpoint: {
                    serial_number: curDevice!.serial_number,
                    third_serial_number: deviceSetting.mac,
                },
                payload: {
                    online
                },
            },
        }
        const syncRes = await syncDeviceOnlineToIHost(params);
        logger.info(`[handleSwitchMQTTMsg] device online sync to iHost result ${JSON.stringify(syncRes)}`);
    }



}


/**
 * @description 处理setOption选项的变化
 * @param {IMqttReceiveEvent<any>} eventData
 * @param {TDeviceSetting} deviceSetting
 * @returns {*} 
 */
function handleSetOptionChange(eventData: IMqttReceiveEvent<any>, deviceSetting: TDeviceSetting) {
    logger.info(`[handleSetOptionChange] handle setOption change`);
    const { data } = eventData;
    const { so } = deviceSetting as INotSupport;
    const setOptionKey = Object.keys(data)[0];

    for (const key in so) {
        if (`setoption${key}` === setOptionKey.toLowerCase()) {
            so[key as keyof ISetOptions] = data[setOptionKey] === 'ON' ? 1 : 0;
        }
    }


    deviceSetting.so = so;

    const deviceSettingList = getDeviceSettingList();
    const curIdx = deviceSettingList.findIndex(curDeviceSetting => curDeviceSetting.mac === deviceSetting.mac);
    deviceSettingList[curIdx] = deviceSetting;
    updateDeviceSettingList(deviceSettingList);
}



/**
 * @description 判断 result topic 是否为特定topic
 * @param {object} data
 * @param {('power' | 'setOption')} topicType
 * @returns {*}  {boolean}
 */
function isCertainTopic(data: object, topicType: 'power' | 'setOption'): boolean {
    return Object.keys(data).some(key => key.toLowerCase().includes(topicType.toLowerCase()));
}



export default {
    resubscribeMQTTTopic,
    handleMQTTReceiveMsg
}