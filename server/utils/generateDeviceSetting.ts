import _ from 'lodash';
import logger from "../log";
import EDeviceType from "../ts/enum/EDeviceType";
import ERelayType from "../ts/enum/ERelayType";
import { IDiscoveryMsg } from "../ts/interface/IDiscoveryMsg";
import { INotSupport } from "../ts/interface/INotSupport";
import { ICapability, IState, ISwitch } from "../ts/interface/ISwitch"
import { TAG_DATA_NAME } from '../const';

interface IDeviceSetting {
    [EDeviceType.SWITCH]: (discovery: IDiscoveryMsg) => ISwitch,
    [EDeviceType.UNKNOWN]: (discovery: IDiscoveryMsg) => INotSupport,
}


export const DEVICE_SETTINGS: IDeviceSetting = {
    [EDeviceType.SWITCH]: getSwitchSetting,
    [EDeviceType.UNKNOWN]: getNotSupportDeviceSetting
}



/**
 * @description 生成不支持设备的 setting
 * @param {IDiscoveryMsg} discovery
 * @returns {*}  {INotSupport}
 */
function getNotSupportDeviceSetting(discovery: IDiscoveryMsg): INotSupport {
    const { dn, mac, sw, md, t, so } = discovery;
    const notSupportSetting: INotSupport = {
        display_category: EDeviceType.UNKNOWN,
        name: dn,
        mac: mac,
        online: false,
        model: md,
        mqttTopics: {
            topic: t,
            availability_topic: getTopicTelemetryWill(discovery),
            availability_offline: discovery['ofln'],
            availability_online: discovery['onln'],
            fallback_topic: getFallbackTopicFromMac(mac)
        },
        so,
        sw_version: sw
    }

    return notSupportSetting;
}


/**
 * @description 生成 switch 设备的 setting
 * @param {IDiscoveryMsg} discovery
 * @returns {*}  {ISwitch}
 */
function getSwitchSetting(discovery: IDiscoveryMsg): ISwitch {
    const { rl, mac, fn, dn, ofln, onln, sw, md, t, so } = discovery;

    /** 通道数量 */
    let channelNum = 0;
    /** 能力列表 */
    let capabilities: ICapability[] = [
        {
            capability: 'power',
            permission: 'readWrite'
        }
    ];
    /** 设备状态 */
    let state: IState = {
        power: {
            powerState: "off"
        }
    }
    /** 设备的tags */
    let tags: any = {
        [TAG_DATA_NAME]: {
            deviceId: mac,
        }
    }
    /** power topic 用于setOption4为true时使用 */
    const power_topics: string[] = [];
    /** 获取 state topic 前缀 */
    const topicState = getTopicState(discovery)


    // 1.判断设备有几个通道
    for (const relay of rl) {
        // 除了1以外均不算开关
        if (relay !== ERelayType.SWITCH) break;
        // 暂时只允许四通道
        if (channelNum === 4) break;
        channelNum++;
    }


    // 生成多通道的能力与状态
    if (channelNum > 1) {
        for (let channel = 0; channel < channelNum; channel++) {

            let name = fn[channel];
            const curChannel = channel + 1;

            if (!name) {
                name = `${dn} switch ${curChannel}`;
            }

            // 添加能力
            capabilities.push({
                capability: 'toggle',
                permission: 'readWrite',
                name: `${curChannel}`
            });

            // 添加状态
            if (!state.toggle) {
                _.assign(state, {
                    toggle: {
                        [curChannel]: {
                            toggleState: 'off'
                        }
                    }
                })
            } else {
                _.assign(state.toggle, {
                    [curChannel]: {
                        toggleState: 'off'
                    }
                })
            }

            if (!tags.toggle) {
                _.assign(tags, {
                    toggle: {
                        [curChannel]: name
                    }
                })
            } else {
                _.assign(tags.toggle, {
                    [curChannel]: name
                })
            }

            power_topics.push(`${topicState}POWER${curChannel}`);
        }
    } else {
        power_topics.push(`${topicState}POWER`);
    }



    const switchSetting: ISwitch = {
        display_category: EDeviceType.SWITCH,
        name: dn,
        capabilities,
        state,
        tags,
        online: false,
        model: md,
        mac,
        mqttTopics: {
            topic: t,
            poll_topic: getTopicCommandState(discovery),
            availability_topic: getTopicTelemetryWill(discovery),
            availability_offline: ofln,
            availability_online: onln,
            command_topic: getTopicCommand(discovery),
            result_topic: getTopiCommandResult(discovery),
            state_power_off: getStatePowerOff(discovery),
            state_power_on: getStatePowerOn(discovery),
            state_topic_all: getTopicAllStateTopic(discovery),
            state_topic: getTopicTelemetryState(discovery),
            fallback_topic: getFallbackTopicFromMac(mac),
            power_topics
        },
        so,
        sw_version: sw
    }


    return switchSetting;
}


/**
 * @description 根据fullTopic获取对应topic
 * @param {IDiscoveryMsg} discovery
 * @param {string} prefix
 * @returns {*}  {string}
 */
function getTopic(discovery: IDiscoveryMsg, prefix: string): string {
    let topic = discovery['ft'];
    topic = topic.replace("%hostname%", discovery['hn'])
    topic = topic.replace("%id%", discovery['mac'].slice(-6))
    topic = topic.replace("%prefix%", prefix)
    topic = topic.replace("%topic%", discovery['t']);
    return topic
}



/**
 * @description 根据mac生成fallback topic
 * @param {string} mac
 * @returns {*}  {string}
 */
function getFallbackTopicFromMac(mac: string): string {
    return `DVES_${mac.slice(-6)}_fb`;
}


/**
 * @description 根据discovery获取指令topic
 * @param {IDiscoveryMsg} discovery
 * @returns {*}  {string}
 */
function getTopicCommand(discovery: IDiscoveryMsg): string {
    return getTopic(discovery, discovery['tp'][0])
}


/**
 * @description 根据 discovery 获取状态topic
 * @param {IDiscoveryMsg} discovery
 * @returns {*}  {string}
 */
function getTopicState(discovery: IDiscoveryMsg): string {
    return getTopic(discovery, discovery['tp'][1])
}


/**
 * @description 根据 discovery 获取上报topic
 * @param {IDiscoveryMsg} discovery
 * @returns {*}  {string}
 */
function getTopicTelemetry(discovery: IDiscoveryMsg): string {
    return getTopic(discovery, discovery['tp'][2])
}


/**
 * @description 获取上下线topic
 * @param {IDiscoveryMsg} discovery
 * @returns {*}  {string}
 */
function getTopicTelemetryWill(discovery: IDiscoveryMsg): string {
    return getTopicTelemetry(discovery) + 'LWT';
}


/**
 * @description 获取设备state topic
 * @param {IDiscoveryMsg} discovery
 * @returns {*}  {string}
 */
function getTopicCommandState(discovery: IDiscoveryMsg): string {
    return getTopicCommand(discovery) + 'STATE';
}


/**
 * @description 获取指令结果 result topic
 * @param {IDiscoveryMsg} discovery
 * @returns {*}  {string}
 */
function getTopiCommandResult(discovery: IDiscoveryMsg): string {
    return getTopicState(discovery) + 'RESULT';
}


/**
 * @description 获取 power off 的值
 * @param {IDiscoveryMsg} discovery
 * @returns {*}  {string}
 */
function getStatePowerOff(discovery: IDiscoveryMsg): string {
    return discovery['state'][0];
}


/**
 * @description 获取 power on 的值
 * @param {IDiscoveryMsg} discovery
 * @returns {*}  {string}
 */
function getStatePowerOn(discovery: IDiscoveryMsg): string {
    return discovery['state'][1];
}


/**
 * @description 获取设备的上报 state topic
 * @param {IDiscoveryMsg} discovery
 * @returns {*}  {string}
 */
function getTopicTelemetryState(discovery: IDiscoveryMsg): string {
    return getTopicTelemetry(discovery) + 'STATE';
}


/**
 * @description 获取设备的上报的所有state topic
 * @param {IDiscoveryMsg} discovery
 * @returns {*}  {string}
 */
function getTopicAllStateTopic(discovery: IDiscoveryMsg): string {
    return getTopicState(discovery) + '#';
}

