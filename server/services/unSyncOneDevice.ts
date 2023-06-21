import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import { deleteDevice, getIHostSyncDeviceList } from '../cube-api/api';
import { getDeviceSettingList } from '../utils/tmp';


/**
 * @description 取消同步单个设备
 * @export
 * @param {Request} req
 * @param {Response} res
 * @returns {*} 
 */
export default async function unSyncOneDevice(req: Request, res: Response) {
    try {

        /** 将要被取消同步的设备 ID */
        const willUnSyncDeviceId = req.params.deviceId;
        /** 设备数据 */
        const deviceSettingList = getDeviceSettingList();

        const result = await getIHostSyncDeviceList()
        if (result.error === 401) {
            logger.error(`[unSyncOneDevice] iHost token invalid`)
            return res.json(toResponse(602));
        } else if (result.error !== 0) {
            logger.error(`[unSyncOneDevice] get iHost device list failed => ${JSON.stringify(result)}`)
            return res.json(toResponse(500));
        }
        const deviceList = result.data!.device_list;

        const deviceSetting = deviceSettingList.some(setting => setting.mac === willUnSyncDeviceId);
        if (!deviceSetting) {
            logger.error(`[unSyncOneDevice] unSync deviceId ${willUnSyncDeviceId} is not exist in ${JSON.stringify(deviceSettingList)}`);
            return res.json(toResponse(1801));
        }

        // 不存在iHost的设备不需要取消同步
        const curDevice = deviceList.find(device => JSON.stringify(device.tags).includes(willUnSyncDeviceId));
        if (!curDevice) {
            logger.error(`[unSyncOneDevice] unSync deviceId ${willUnSyncDeviceId} is not exist in iHost`);
            return res.json(toResponse(1802));
        }


        const deleteRes = await deleteDevice(curDevice.serial_number);
        if (deleteRes.error === 401) {
            logger.error(`[unSyncOneDevice] unSync deviceId ${willUnSyncDeviceId} failed. iHost token invalid`)
            return res.json(toResponse(602));
        } else if (deleteRes.error === 110000) {
            logger.error(`[unSyncOneDevice] unSync deviceId ${willUnSyncDeviceId} failed. Device is not exist in iHost`);
            return res.json(toResponse(1802));
        } else if (deleteRes.error !== 0) {
            logger.error(`[unSyncOneDevice] unSync deviceId ${willUnSyncDeviceId} failed. => ${JSON.stringify(result)}`)
            return res.json(toResponse(500));
        }

        return res.json(toResponse(0));
    } catch (error: any) {
        logger.error(`get MQTT Broker error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
