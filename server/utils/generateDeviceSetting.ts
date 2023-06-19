import _ from 'lodash';
import logger from "../log";
import EDeviceType from "../ts/enum/EDeviceType";
import ERelayType from "../ts/enum/ERelayType";
import { IDiscoveryMsg } from "../ts/interface/IDiscoveryMsg";
import { INotSupport } from "../ts/interface/INotSupport";
import { ICapability, IState, ISwitch } from "../ts/interface/ISwitch"

interface IDeviceSetting {
    [EDeviceType.SWITCH]: (discovery: IDiscoveryMsg) => ISwitch,
    [EDeviceType.NOT_SUPPORTED]: (discovery: IDiscoveryMsg) => INotSupport,
}


export const DEVICE_SETTINGS: IDeviceSetting = {
    [EDeviceType.SWITCH]: getSwitchSetting,
    [EDeviceType.NOT_SUPPORTED]: getNotSupportDeviceSetting
}



/**
 * @description 生成不支持设备的 setting
 * @param {IDiscoveryMsg} discovery
 * @returns {*}  {INotSupport}
 */
function getNotSupportDeviceSetting(discovery: IDiscoveryMsg): INotSupport {
    const { dn, mac, sw } = discovery;
    const notSupportSetting: INotSupport = {
        display_category: EDeviceType.NOT_SUPPORTED,
        name: dn,
        mac: mac,
        availability_topic: getTopicTelemetryWill(discovery),
        availability_offline: discovery['ofln'],
        availability_online: discovery['onln'],
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
    const { rl, mac, fn, dn, ofln, onln, sw } = discovery;

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


    // 1.判断设备有几个通道
    for (const relay of rl) {
        // 除了1以外均不算开关
        if (relay !== ERelayType.SWITCH) break;
        // 暂时只允许四通道
        if (channelNum === 4) break;
        channelNum++;
    }

    logger.info(`[getSwitchSetting] cur device ${mac}'s channel number is ${channelNum}`);

    // 生成多通道的能力与状态
    if (channelNum > 1) {
        for (let channel = 1; channel <= channelNum; channel++) {

            let name = fn[channel];

            if (!name) {
                name = `${dn} switch ${channelNum}`;
            }

            // 添加能力
            capabilities.push({
                capability: 'toggle',
                permission: 'readWrite',
                name
            });

            // 添加状态
            _.assign(state, {
                toggle: {
                    [channelNum]: {
                        toggleState: 'off'
                    }
                }
            })
        }
    }



    const switchSetting: ISwitch = {
        display_category: EDeviceType.SWITCH,
        name: dn,
        capabilities,
        state,
        mac,
        poll_topic: getTopicCommandState(discovery),
        availability_topic: getTopicTelemetryWill(discovery),
        availability_offline: ofln,
        availability_online: onln,
        command_topic: getTopicCommand(discovery),
        result_topic: getTopiCommandResult(discovery),
        state_power_off: getStatePowerOff(discovery),
        state_power_on: getStatePowerOn(discovery),
        state_topic: getTopicTelemetryState(discovery),
        fallback_topic: "",
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
    let topic = discovery['ft']
    topic = topic.replace("%hostname%", discovery['hn'])
    topic = topic.replace("%id%", discovery['mac'].slice(-6))
    topic = topic.replace("%prefix%", prefix)
    topic = topic.replace("%topic%", discovery['t'])
    return topic
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
 * @returns {*} 
 */
function getTopicTelemetryWill(discovery: IDiscoveryMsg) {
    return getTopicTelemetry(discovery) + 'LWT';
}


/**
 * @description 获取设备state topic
 * @param {IDiscoveryMsg} discovery
 * @returns {*} 
 */
function getTopicCommandState(discovery: IDiscoveryMsg) {
    return getTopicCommand(discovery) + 'STATE';
}


/**
 * @description 获取指令结果 result topic
 * @param {IDiscoveryMsg} discovery
 * @returns {*} 
 */
function getTopiCommandResult(discovery: IDiscoveryMsg) {
    return getTopicState(discovery) + 'RESULT';
}


/**
 * @description 获取 power off 的值
 * @param {IDiscoveryMsg} discovery
 * @returns {*} 
 */
function getStatePowerOff(discovery: IDiscoveryMsg) {
    return discovery['state'][0];
}


/**
 * @description 获取 power on 的值
 * @param {IDiscoveryMsg} discovery
 * @returns {*} 
 */
function getStatePowerOn(discovery: IDiscoveryMsg) {
    return discovery['state'][1];
}


/**
 * @description 获取设备的上报 state topic
 * @param {IDiscoveryMsg} discovery
 * @returns {*} 
 */
function getTopicTelemetryState(discovery: IDiscoveryMsg) {
    return getTopicTelemetry(discovery) + 'STATE';
}

