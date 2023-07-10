import _ from 'lodash';
import logger from "../log";
import { v4 as uuid } from 'uuid';
import { getIHostSyncDeviceList, syncDeviceOnlineToIHost } from "../cube-api/api";
import IHostDevice from "../ts/interface/IHostDevice";
import { TDeviceSetting, getDeviceSettingList } from "./tmp";
import EDeviceType from '../ts/enum/EDeviceType';

/**
 * @description 检查iHost设备列表中是否存在指定tasmota设备
 * @param {IHostDevice[]} deviceList
 * @param {string} mac
 * @returns {*} 
 */
export function checkTasmotaDeviceInIHost(deviceList: IHostDevice[], mac: string) {
    return deviceList.some(device => JSON.stringify(device.tags).includes(mac));
}


/**
 * @description 离线与在线所有tasmota同步设备
 * @export
 * @returns {*} 
 */
export async function allTasmotaDeviceOnOrOffline(type: 'online' | 'offline') {
    const res = await getIHostSyncDeviceList();
    if (res.error !== 0) {
        logger.error(`[allTasmotaDeviceOffline] get iHost sync device list fail! => ${JSON.stringify(res)}`);
        return;
    }


    const deviceList = res.data!.device_list
    const deviceSettingList = getDeviceSettingList();
    const syncedDevices: { device: IHostDevice, deviceSetting: TDeviceSetting }[] = [];
    deviceList.forEach(device => {
        const deviceSetting = deviceSettingList.find(deviceSetting => JSON.stringify(device.tags).includes(deviceSetting.mac));
        if (deviceSetting) {
            syncedDevices.push({
                device,
                deviceSetting
            })
        }
    });

    logger.info(`[allTasmotaDeviceOffline] all synced device ${syncedDevices.length}`);


    for (const devices of syncedDevices) {
        const { device, deviceSetting } = devices;
        const params = {
            event: {
                header: {
                    name: 'DeviceOnlineChangeReport',
                    message_id: uuid(),
                    version: '1',
                },
                endpoint: {
                    serial_number: device.serial_number,
                    third_serial_number: deviceSetting.mac,
                },
                payload: {
                    online: type === 'offline' ? false : deviceSetting.online
                },
            },
        }

        logger.info(`[allTasmotaDeviceOffline] device ${deviceSetting.mac} offline params ${JSON.stringify(params)}`);
        const syncOnlineRes = await syncDeviceOnlineToIHost(params)
        logger.info(`[allTasmotaDeviceOffline] device ${deviceSetting.mac} offline result ${JSON.stringify(syncOnlineRes)}`)
    }
}


/**
 * @description 从设备配置中获取开关的通道数
 * @export
 * @param {TDeviceSetting} deviceSetting
 * @returns {*}  {number}
 */
export function getSwitchChannel(deviceSetting: TDeviceSetting): number {
    if (deviceSetting.display_category !== EDeviceType.SWITCH) return 0;
    const toggleState = _.get(deviceSetting.state, 'toggle');
    return toggleState ? Object.keys(toggleState).length : 1;
}