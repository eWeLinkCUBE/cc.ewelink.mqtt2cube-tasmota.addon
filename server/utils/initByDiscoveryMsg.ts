import _ from 'lodash';
import { IDiscoveryMsg } from "../ts/interface/IDiscoveryMsg";
import { TDeviceSetting, TDeviceSettingList, getDeviceSettingList, updateDeviceSettingList } from "./tmp";
import ERelayType from '../ts/enum/ERelayType';
import EDeviceType from '../ts/enum/EDeviceType';
import { DEVICE_SETTINGS } from './generateDeviceSetting';
import { deleteDevice, getIHostSyncDeviceList } from '../cube-api/api';
import logger from '../log';
import { TAG_DATA_NAME } from '../const';
import mqtt from './mqtt';


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
async function compareSetting(newSetting: TDeviceSetting, oldSetting: TDeviceSetting): Promise<TDeviceSetting> {
    // 1. 获取iHost设备列表
    const res = await getIHostSyncDeviceList();
    if (res.error !== 0) {
        logger.error(`[compareSetting] get iHost sync device list error => ${JSON.stringify(res)}`);
        return newSetting;
    }
    const deviceList = res.data!.device_list;

    // 2. 判断设备是否已经同步
    const curDevice = deviceList.find(device => {
        const data = _.get(device, ['tags', TAG_DATA_NAME]);
        if (!data) return false;
        return data.deviceId === newSetting.mac;
    })

    // 3. 没有同步则直接替换
    if (!curDevice) {
        return newSetting;
    }

    // 4. 已同步则比较类型有无变化
    const isCategoryChanged = newSetting.display_category !== oldSetting.display_category;

    // 5. 类型已经发生变化则做对应处理
    if (isCategoryChanged) {
        // 类型变为 notSupported 则将设备取消同步
        if (newSetting.display_category === EDeviceType.NOT_SUPPORTED) {
            logger.info(`[compareSetting] device ${newSetting.mac} has change from ${oldSetting.display_category} to ${newSetting.display_category}`);
            const res = await deleteDevice(curDevice.serial_number);
            logger.info(`[compareSetting] delete device id ${curDevice.serial_number} result => ${JSON.stringify(res)}`);
            return newSetting;
        }

        // 从一种类型变为另一种类型的处理，目前只支持switch，所以暂时不需要处理
    }

    // 6. 类型没有变化则直接更新
    mqtt.resubscribeMQTTTopic(newSetting, oldSetting);
    return newSetting;
}


export async function initByDiscoveryMsg(payload: IDiscoveryMsg) {
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
    const newDeviceSetting = await compareSetting(curDeviceSetting, deviceSettingList[deviceSettingIdx]);

    // 5. 将最终生成的新setting更新回去
    deviceSettingList[deviceSettingIdx] = newDeviceSetting;
    updateDeviceSettingList(deviceSettingList);
}