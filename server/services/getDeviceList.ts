import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import { getDeviceSettingList } from '../utils/tmp';
import { getIHostSyncDeviceList } from '../cube-api/api';


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
        const deviceRes = await getIHostSyncDeviceList();
        if (deviceRes.error !== 0) {
            logger.error(`[getDeviceList] getIHostSyncDeviceList error => ${JSON.stringify(deviceRes)}`);
            return res.json(toResponse(500));
        }

        const deviceList = deviceRes.data!.device_list;
        const deviceSettingList = getDeviceSettingList();
        const deviceInfoList: IDeviceInfo[] = [];
        for (const deviceSetting of deviceSettingList) {
            const { name, display_category, mac, online } = deviceSetting;
            const synced = deviceList.some(device => JSON.stringify(device.tags).includes(mac));
            deviceInfoList.push({
                name,
                category: display_category,
                id: mac,
                online,
                synced
            })
        }

        logger.info(`[getDeviceList] final device info list => ${JSON.stringify(deviceInfoList)}`);

        return res.json(toResponse(0, 'success', deviceInfoList));
    } catch (error: any) {
        logger.error(`[getDeviceList] error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
