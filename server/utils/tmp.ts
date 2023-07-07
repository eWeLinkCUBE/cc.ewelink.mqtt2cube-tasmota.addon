import logger from "../log";
import { INotSupport } from "../ts/interface/INotSupport";
import { ISwitch } from "../ts/interface/ISwitch";

export type TDeviceSetting = ISwitch | INotSupport;

export type TDeviceSettingList = Array<TDeviceSetting>;

/** 设备配置信息缓存 */
let deviceSettingList: TDeviceSettingList = [];
/** mqtt 连接情况 */
let mqttConnected: boolean = false;

/**
 * @description 更新设备配置列表
 * @param {TDeviceSettingList} deviceSettingList
 */
export function updateDeviceSettingList(newSettingList: TDeviceSettingList) {
    deviceSettingList = newSettingList;
}


/**
 * @description 获取设备配置列表
 * @returns {*} 
 */
export function getDeviceSettingList() {
    return deviceSettingList;
}


/**
 * @description 更新 mqtt 连接情况
 * @param {TDeviceSettingList} deviceSettingList
 */
export function updateMQTTConnected(connected: boolean) {
    mqttConnected = connected;
}


/**
 * @description 获取 mqtt 连接情况
 * @returns {*} 
 */
export function getMQTTConnected() {
    return mqttConnected;
}