import { request } from ".";
import EMethod from "../ts/enum/EMethod";
import IHostDevice from "../ts/interface/IHostDevice";
import IResponse from "../ts/interface/IResponse";



/**
 * @description 获取 iHost 网关 token
 * @export
 * @param {{ app_name: string }} params
 * @returns {*}  {Promise<IResponse<{ token: string }>>}
 */
export async function getPermissionApi(params: { app_name: string }): Promise<IResponse<{ token: string }>> {
    return await request<{ token: string }>('/bridge/access_token', EMethod.GET, params);
};


/**
 * @description 获取iHost设备列表
 * @export
 * @returns {*}  {Promise<IResponse<{ device_list: IHostDevice[] }>>}
 */
export async function getIHostSyncDeviceList(): Promise<IResponse<{ device_list: IHostDevice[] }>> {
    return request<{ device_list: IHostDevice[] }>('/devices', EMethod.GET);
};



/**
 * @description 删除对应子设备
 * @export
 * @param {string} serialNumber
 * @returns {*}  {Promise<IResponse<any>>}
 */
export async function deleteDevice(serialNumber: string): Promise<IResponse<any>> {
    return request(`/devices/${serialNumber}`, EMethod.DELETE);
};