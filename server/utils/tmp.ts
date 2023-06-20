import { INotSupport } from "../ts/interface/INotSupport";
import { ISwitch } from "../ts/interface/ISwitch";

export type TDeviceSetting = ISwitch | INotSupport;

export type TDeviceSettingList = Array<TDeviceSetting>;

/** 设备配置信息缓存 */
let deviceSettingList: TDeviceSettingList = [];

/**
 * @description 更新设设备配置列表
 * @param {TDeviceSettingList} deviceSettingList
 */
export function updateDeviceSettingList(deviceSettingList: TDeviceSettingList) {
    deviceSettingList = deviceSettingList;
}


/**
 * @description 获取设备配置列表
 * @returns {*} 
 */
export function getDeviceSettingList() {
    return deviceSettingList;
}