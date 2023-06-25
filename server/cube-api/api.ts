import { request, requestThirdParty } from ".";
import EMethod from "../ts/enum/EMethod";
import IHostDevice from "../ts/interface/IHostDevice";
import IResponse from "../ts/interface/IResponse";


interface ISyncDeviceToIHostRes {
    header: {
        name: 'Response' | 'ErrorResponse';
        message_id: string;
        version: string;
    };
    payload: {
        endpoints: {
            serial_number: string;
            third_serial_number: string;
        }[];
        //错误时只返回以下两项
        type?: string;
        description?: string;
    };
}



export interface ISyncDeviceToIHostReq {
    event: {
        header: {
            name: string;
            message_id: string;
            version: string;
        };
        payload: {
            endpoints: {
                third_serial_number: string;
                name: string;
                display_category: string;
                capabilities: any[];
                state: any;
                tags: any;
                firmware_version: string;
                service_address: string;
            }[];
        };
    };
}

interface SyncDeviceOnlineToIHostReq {
    event: {
        header: {
            name: string;
            message_id: string;
            version: string;
        };
        endpoint: {
            serial_number: string;
            third_serial_number: string;
        };
        payload: {
            online: boolean;
        };
    };
}


interface SyncDeviceStateToIHostReq {
    event: {
        header: {
            name: string;
            message_id: string;
            version: string;
        };
        endpoint: {
            serial_number: string;
            third_serial_number: string;
        };
        payload: {
            state: any;
        };
    };
}


interface SyncDeviceInfoToIHostRes {
    header: {
        name: 'Response';
        message_id: string;
        version: string;
    };
    payload: object;
}

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
    return await request<{ device_list: IHostDevice[] }>('/devices', EMethod.GET);
};


/**
 * @description 删除对应子设备
 * @export
 * @param {string} serialNumber
 * @returns {*}  {Promise<IResponse<any>>}
 */
export async function deleteDevice(serialNumber: string): Promise<IResponse<any>> {
    return await request(`/devices/${serialNumber}`, EMethod.DELETE);
};


/**
 * @description 批量同步设备
 * @export
 * @param {ISyncDeviceToIHostReq} params
 * @returns {*} 
 */
export async function syncDeviceToIHost(params: ISyncDeviceToIHostReq) {
    return await requestThirdParty<ISyncDeviceToIHostRes>('/thirdparty/event', EMethod.POST, params);
};


/**
 * @description 设备上下线状态同步
 * @export
 * @param {SyncDeviceOnlineToIHostReq} params
 * @returns {*} 
 */
export const syncDeviceOnlineToIHost = (params: SyncDeviceOnlineToIHostReq) => {
    return requestThirdParty<SyncDeviceInfoToIHostRes>('/thirdparty/event', EMethod.POST, params);
};


/**
 * @description 设备状态状态同步
 * @export
 * @param {SyncDeviceOnlineToIHostReq} params
 * @returns {*} 
 */
export const syncDeviceStateToIHost = (params: SyncDeviceStateToIHostReq) => {
    return requestThirdParty<SyncDeviceInfoToIHostRes>('/thirdparty/event', EMethod.POST, params);
};