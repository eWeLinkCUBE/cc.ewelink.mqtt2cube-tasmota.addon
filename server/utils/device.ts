import _ from 'lodash';
import logger from "../log";
import { v4 as uuid } from 'uuid';
import { getIHostSyncDeviceList, syncDeviceOnlineToIHost } from "../cube-api/api";
import IHostDevice from "../ts/interface/IHostDevice";
import { getDeviceSettingList } from "./tmp";
import { TAG_DATA_NAME } from '../const';

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
 * @description 离线所有tasmota同步设备
 * @export
 * @returns {*} 
 */
export async function allTasmotaDeviceOffline() {
    const res = await getIHostSyncDeviceList();
    if (res.error !== 0) {
        logger.error(`[allTasmotaDeviceOffline] get iHost sync device list fail! => ${JSON.stringify(res)}`);
        return;
    }


    const deviceList = res.data!.device_list
    const deviceSettingList = getDeviceSettingList();
    const syncedDevice = deviceList.filter(device => {
        return deviceSettingList.some(deviceSetting => JSON.stringify(device.tags).includes(deviceSetting.mac));
    });

    logger.info(`[allTasmotaDeviceOffline] all synced device ${JSON.stringify(syncedDevice)}`);


    for (const device of syncedDevice) {
        const third_serial_number = _.get(device, ['tags', TAG_DATA_NAME, 'deviceId'])
        const params = {
            event: {
                header: {
                    name: 'DeviceOnlineChangeReport',
                    message_id: uuid(),
                    version: '1',
                },
                endpoint: {
                    serial_number: device.serial_number,
                    third_serial_number: third_serial_number,
                },
                payload: {
                    online: false
                },
            },
        }

        logger.info(`[allTasmotaDeviceOffline] device ${third_serial_number} offline params ${JSON.stringify(params)}`);
        const syncOnlineRes = await syncDeviceOnlineToIHost(params)
        logger.info(`[allTasmotaDeviceOffline] device ${third_serial_number} offline result ${JSON.stringify(syncOnlineRes)}`)
    }
}