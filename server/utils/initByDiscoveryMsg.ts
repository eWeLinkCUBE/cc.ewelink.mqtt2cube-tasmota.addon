import _ from 'lodash';
import { IDiscoveryMsg } from "../ts/interface/IDiscoveryMsg";
import { TDeviceSetting, TDeviceSettingList, getDeviceSettingList, updateDeviceSettingList } from "./tmp";
import ERelayType from '../ts/enum/ERelayType';
import EDeviceType from '../ts/enum/EDeviceType';
import { DEVICE_SETTINGS } from './generateDeviceSetting';


/** relay与类型的映射 */
const RELAY_MAPPING = {
    [ERelayType.SWITCH]: EDeviceType.SWITCH
}



/**
 * @description 解析discovery信息
 * @param {IDiscoveryMsg} discovery
 * @returns {*}  {TDeviceSettingList}
 */
function analyzeDiscovery(discovery: IDiscoveryMsg): TDeviceSetting {
    const { rl } = discovery;

    // 1.判断rl第一个即为1的则为switch设备，其余为不支持
    const type = _.get(RELAY_MAPPING, rl[0], EDeviceType.NOT_SUPPORTED);

    // 2.根据类型获取生成方法
    const func = DEVICE_SETTINGS[type];

    // 3.返回生成结果
    return func(discovery);
}


/**
 * @description 比较新旧两个配置，生成一个新的配置
 * @param {TDeviceSetting} newSetting
 * @param {TDeviceSetting} oldSetting
 * @returns {*}  {TDeviceSetting}
 */
function compareSetting(newSetting: TDeviceSetting, oldSetting: TDeviceSetting): TDeviceSetting {
    
}


export function initByDiscoveryMsg(payload: IDiscoveryMsg) {
    const { mac } = payload;

    const deviceSettingList = getDeviceSettingList();

    // 1.判断这个mac地址在缓存中是否存在
    const deviceSettingIdx = _.findIndex(deviceSettingList, { mac });

    // 2.根据生成对应的数据结构
    const curDeviceSetting = analyzeDiscovery(payload)

    // 3. 缓存如果不存在，直接更新到缓存中去
    if (deviceSettingIdx === -1) {
        deviceSettingList.push(curDeviceSetting);
        updateDeviceSettingList(deviceSettingList);
        return;
    }

    // 4. 缓存如果存在，对比缓存中哪些东西产生了变化
    const newDeviceSetting = compareSetting(curDeviceSetting, deviceSettingList[deviceSettingIdx]);

    // 5. 将最终生成的新setting更新回去
    deviceSettingList[deviceSettingIdx] = newDeviceSetting;
    updateDeviceSettingList(deviceSettingList);
}