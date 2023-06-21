import IHostDevice from "../ts/interface/IHostDevice";

/**
 * @description 检查iHost设备列表中是否存在指定tasmota设备
 * @param {IHostDevice[]} deviceList
 * @param {string} mac
 * @returns {*} 
 */
export function checkTasmotaDeviceInIHost(deviceList: IHostDevice[], mac: string) {
    return deviceList.some(device => JSON.stringify(device.tags).includes(mac));
}