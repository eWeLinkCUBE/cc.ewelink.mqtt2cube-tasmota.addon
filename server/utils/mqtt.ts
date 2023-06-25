import logger from "../log";
import mqttClient, { getMQTTClient } from "../ts/class/mqtt";
import EDeviceType from "../ts/enum/EDeviceType";
import { IDiscoveryMsg } from "../ts/interface/IDiscoveryMsg";
import { IMqttReceiveEvent } from "../ts/interface/IMqtt";
import { initByDiscoveryMsg } from "./initByDiscoveryMsg";
import { TDeviceSetting } from "./tmp";


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
    if (isDiscoveryMsg(eventData.topic)) {
        await initByDiscoveryMsg(eventData as IMqttReceiveEvent<IDiscoveryMsg>);
        return;
    }
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