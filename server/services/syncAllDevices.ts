import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import db from '../utils/db';
import { getDeviceSettingList } from '../utils/tmp';


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

        // TODO
        // 剔除掉所有unknown设备以及已同步的设备


        // if (deviceSetting.display_category === EDeviceType.UNKNOWN) {
        //     logger.error(`[syncOneDevice] unknown device ${userMac} is not allowed to sync`);
        //     return res.json(toResponse(1302));
        // }

        // // 生成请求参数
        // const params = generateIHostDevice([deviceSetting]);

        // // 开始同步
        // const syncRes = await syncDeviceToIHost(params);

        // if (!syncRes) {
        //     logger.error('[syncDevices] sync device to iHost fail----------------------');
        //     return res.json(toResponse(500));
        // }

        // if (syncRes?.payload.description === 'headers.Authorization is invalid') {
        //     logger.info('[syncDevices] sync iHost device,iHost token useless-------------------------clear');
        //     return res.json(toResponse(602));
        // }

        // if (syncRes?.payload.type === 'INVALID_PARAMETERS') {
        //     logger.error(`[syncDevices] sync device to iHost error params------------------ ${JSON.stringify(params)} ${syncRes.payload}`);
        //     //参数错误
        //     return res.json(toResponse(500));
        // }


        return res.json(toResponse(0));
    } catch (error: any) {
        logger.error(`get MQTT Broker error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
