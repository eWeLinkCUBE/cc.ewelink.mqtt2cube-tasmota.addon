import _ from 'lodash';
import logger from "../log";
import { v4 as uuid } from 'uuid';
import { getMQTTClient } from "../ts/class/mqtt";
import EDeviceType from "../ts/enum/EDeviceType";
import { IDiscoveryMsg } from "../ts/interface/IDiscoveryMsg";
import { IMqttReceiveEvent, IStateTopic } from "../ts/interface/IMqtt";
import { INotSupport } from "../ts/interface/INotSupport";
import { initByDiscoveryMsg } from "./initByDiscoveryMsg";
import { TDeviceSetting, getDeviceSettingList, updateDeviceSettingList } from "./tmp";
import { getIHostSyncDeviceList, syncDeviceOnlineToIHost, syncDeviceStateToIHost } from '../cube-api/api';
import { checkTasmotaDeviceInIHost } from './device';

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
        await unsubscribeAllTopic(oldDeviceSetting);
    }

    // 订阅新设备的所有topic
    await subscribeAllTopic(newDeviceSetting);
}


/**
 * @description 处理收到的MQTT消息
 * @param {IMqttReceiveEvent<any>} eventData
 * @returns {*} 
 */
async function handleMQTTReceiveMsg(eventData: IMqttReceiveEvent<any>) {
    logger.info(`[handleMQTTReceiveMsg] topic ${eventData.topic} receive msg => ${typeof eventData.data === 'string' ? eventData.data : JSON.stringify(eventData.data, null, 2)}`);
    const { topic } = eventData
    if (isDiscoveryMsg(topic)) {
        await initByDiscoveryMsg(eventData as IMqttReceiveEvent<IDiscoveryMsg>);
        return;
    }

    const deviceSettingList = getDeviceSettingList()
    for (const deviceSetting of deviceSettingList) {
        const func = _.get(DEVICE_TYPE_TO_FUNC_MAPPING, deviceSetting.display_category);
        if (!func) return;
        await func(eventData, deviceSetting);
    }
}


/**
 * @description 处理SWITCH类设备的消息
 * @param {IMqttReceiveEvent<any>} eventData
 * @param {TDeviceSetting} deviceSetting
 * @returns {*} 
 */
async function handleSwitchMQTTMsg(eventData: IMqttReceiveEvent<any>, deviceSetting: TDeviceSetting) {
    logger.info(`[handleSwitchMQTTMsg] handling switch ${JSON.stringify(eventData)}`);
    if (deviceSetting.display_category !== EDeviceType.SWITCH) return;
    const { topic } = eventData;
    const deviceSettingList = getDeviceSettingList();
    const { mqttTopics: { state_topic, result_topic, availability_topic, availability_online, state_power_on, state_power_off }, capabilities } = deviceSetting;
    const toggleCount = capabilities.filter(capability => capability.capability === 'toggle').length;
    const channelLength = toggleCount === 0 ? 1 : toggleCount;

    if (topic.toLowerCase() === state_topic.toLowerCase() || topic.toLowerCase() === result_topic.toLowerCase()) {
        logger.info(`[handleSwitchMQTTMsg] here is state topic`);
        const payload = eventData.data as IStateTopic;
        if (channelLength === 1) {
            const power = payload.POWER === state_power_on ? "on" : "off";
            deviceSetting.state.power.powerState = power;
            return;
        }

        for (let i = 1; i <= channelLength; i++) {
            const key = `POWER${i}` as keyof IStateTopic;
            const validState = [state_power_on, state_power_off].includes(payload[key] as string);
            if (!validState) continue;
            deviceSetting.state.toggle![i].toggleState = payload[key] === state_power_on ? 'on' : 'off';
        }

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
                        name: 'DeviceStatesChangeReport',
                        message_id: uuid(),
                        version: '1',
                    },
                    endpoint: {
                        serial_number: curDevice!.serial_number,
                        third_serial_number: deviceSetting.mac,
                    },
                    payload: {
                        state: deviceSetting.state
                    },
                },
            }
            logger.info(`[handleSwitchMQTTMsg] device state sync to iHost params ${JSON.stringify(params)}`);
            const syncRes = await syncDeviceStateToIHost(params);
            logger.info(`[handleSwitchMQTTMsg] device state sync to iHost result ${JSON.stringify(syncRes)}`);
        }
    }


    if (topic.toLowerCase() === availability_topic.toLowerCase()) {
        logger.info(`[handleSwitchMQTTMsg] here is LWT topic`);
        deviceSetting.online = eventData.data === availability_online;
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
                        online: deviceSetting.online
                    },
                },
            }
            logger.info(`[handleSwitchMQTTMsg] device online sync to iHost params ${JSON.stringify(params)}`);
            const syncRes = await syncDeviceOnlineToIHost(params);
            logger.info(`[handleSwitchMQTTMsg] device online sync to iHost result ${JSON.stringify(syncRes)}`);
        }
    }

    const curIdx = deviceSettingList.findIndex(curDeviceSetting => curDeviceSetting.mac === deviceSetting.mac);
    deviceSettingList[curIdx] = deviceSetting;
    logger.info(`[handleSwitchMQTTMsg] after update device setting => ${JSON.stringify(deviceSetting)}`);
    updateDeviceSettingList(deviceSettingList);
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
        const { state_topic, poll_topic, result_topic, fallback_topic, availability_topic } = mqttTopics;
        mqttClient.subscribe(state_topic);
        mqttClient.subscribe(poll_topic);
        mqttClient.subscribe(result_topic);
        mqttClient.subscribe(fallback_topic);
        mqttClient.subscribe(availability_topic);
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
        const { state_topic, poll_topic, result_topic, fallback_topic, availability_topic } = mqttTopics;
        mqttClient.unsubscribe(state_topic);
        mqttClient.unsubscribe(poll_topic);
        mqttClient.unsubscribe(result_topic);
        mqttClient.unsubscribe(fallback_topic);
        mqttClient.unsubscribe(availability_topic);
    }

    if (deviceSetting.display_category === EDeviceType.UNKNOWN) {
        const { mqttTopics } = deviceSetting
        const { availability_topic } = mqttTopics;
        mqttClient.unsubscribe(availability_topic);
    }
}


export default {
    resubscribeMQTTTopic,
    handleMQTTReceiveMsg
}