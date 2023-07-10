import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import { getDeviceSettingList } from '../utils/tmp';
import { getIHostSyncDeviceList, syncDeviceToIHost } from '../cube-api/api';
import EDeviceType from '../ts/enum/EDeviceType';
import { generateIHostDevice } from './syncOneDevice';
import { checkTasmotaDeviceInIHost } from '../utils/device';
import db from '../utils/db';


/**
 * @description 同步所有设备
 * @export
 * @param {Request} req
 * @param {Response} res
 * @returns {*} 
 */
export default async function syncAllDevices(req: Request, res: Response) {
    try {

        const deviceSettingList = getDeviceSettingList();
        const result = await getIHostSyncDeviceList();
        if (result.error === 401 || result.error === 400) {
            logger.error(`[syncAllDevices] iHost token invalid`)
            await db.setDbValue('iHostToken', '');
            return res.json(toResponse(602));
        } else if (result.error !== 0) {
            logger.error(`[syncAllDevices] get iHost device list failed => ${JSON.stringify(result)}`)
            return res.json(toResponse(500));
        }
        const deviceList = result.data!.device_list;

        // 剔除掉所有unknown设备以及已同步的设备
        const syncDevice = deviceSettingList.filter(setting => {
            if (checkTasmotaDeviceInIHost(deviceList, setting.mac)) return false;
            if (setting.display_category === EDeviceType.UNKNOWN) return false;
            return true;
        })

        if (syncDevice.length === 0) {
            logger.info(`[syncAllDevices] device to sync is null`);
            return res.json(toResponse(0, 'success', { successList: [] }));
        }

        // 生成请求参数
        const params = generateIHostDevice(syncDevice);

        // 开始同步
        const syncRes = await syncDeviceToIHost(params);
        if (!syncRes) {
            logger.error('[syncAllDevices] sync device to iHost fail----------------------');
            return res.json(toResponse(500));
        }

        if (syncRes?.payload.description === 'headers.Authorization is invalid') {
            logger.info('[syncAllDevices] sync iHost device, iHost token useless');
            await db.setDbValue('iHostToken', '');
            return res.json(toResponse(602));
        }

        if (syncRes?.payload.type === 'INVALID_PARAMETERS') {
            logger.error(`[syncAllDevices] sync device to iHost error params------------------ ${JSON.stringify(params)} error---------------${JSON.stringify(syncRes)}`);
            //参数错误
            return res.json(toResponse(500));
        }

        return res.json(toResponse(0, 'success', { successList: syncDevice.map((item) => item.mac) }));
    } catch (error: any) {
        logger.error(`get MQTT Broker error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
