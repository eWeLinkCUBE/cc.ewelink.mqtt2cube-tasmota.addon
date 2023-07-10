import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import { getDeviceSettingList } from '../utils/tmp';
import { getIHostSyncDeviceList } from '../cube-api/api';
import { checkTasmotaDeviceInIHost } from '../utils/device';
import IHostDevice from '../ts/interface/IHostDevice';
import db from '../utils/db';


interface IDeviceInfo {
    /** 设备名称 */
    name: string,
    /** 设备类型 */
    category: string,
    /** 设备id */
    id: string,
    /** 是否在线 */
    online: boolean,
    /** 是否已同步 */
    synced: boolean
}


/**
 * @description 获取设备列表
 * @export
 * @param {Request} req
 * @param {Response} res
 * @returns {*} 
 */
export default async function getDeviceList(req: Request, res: Response) {
    try {
        let deviceList: IHostDevice[] = [];
        const iHostToken = await db.getDbValue('iHostToken')
        if (iHostToken) {
            const deviceRes = await getIHostSyncDeviceList();
            logger.debug(`[getDeviceList] get device list res => ${JSON.stringify(deviceRes)}`)
            if (deviceRes.error === 401 || deviceRes.error === 400) {
                logger.error(`[getDeviceList] iHost token invalid`)
            } else if (deviceRes.error !== 0) {
                logger.error(`[getDeviceList] get iHost device list failed => ${JSON.stringify(deviceRes)}`)
            } else if (deviceRes.error === 0) {
                deviceList = deviceRes.data!.device_list;
            }
        }

        const deviceSettingList = getDeviceSettingList();
        const deviceInfoList: IDeviceInfo[] = [];
        for (const deviceSetting of deviceSettingList) {
            const { name, display_category, mac, online } = deviceSetting;
            deviceInfoList.push({
                name,
                category: display_category,
                id: mac,
                online,
                synced: checkTasmotaDeviceInIHost(deviceList, mac)
            })
        }

        return res.json(toResponse(0, 'success', deviceInfoList));
    } catch (error: any) {
        logger.error(`[getDeviceList] error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
