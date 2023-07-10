import _ from 'lodash';
import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import { TDeviceSetting, getDeviceSettingList } from '../utils/tmp';
import EDeviceType from '../ts/enum/EDeviceType';
import SSE from '../ts/class/sse';
import config from '../config';
import { ISyncDeviceToIHostReq, getIHostSyncDeviceList, syncDeviceToIHost } from '../cube-api/api';
import { v4 as uuidv4 } from 'uuid';
import { checkTasmotaDeviceInIHost } from '../utils/device';
import ESseEvent from '../ts/enum/ESseEvent';
import db from '../utils/db';



/**
 * 创建设备的 service address
 */
export function createDeviceServiceAddr(deviceId: string) {
    return `${config.localIp}/api/v1/open/device/${deviceId}`;
}


/**
 * @description 生成请求参数
 * @export
 * @param {TDeviceSetting[]} settingList
 * @returns {*} 
 */
export function generateIHostDevice(settingList: TDeviceSetting[]) {
    const params: ISyncDeviceToIHostReq = {
        event: {
            header: {
                name: 'DiscoveryRequest',
                message_id: uuidv4(),
                version: '1',
            },
            payload: {
                endpoints: [],
            },
        },
    }

    for (const deviceSetting of settingList) {
        if (deviceSetting.display_category === EDeviceType.UNKNOWN) continue;

        const { name, mac, model, sw_version, display_category, capabilities, state, tags } = deviceSetting;
        const syncDevice = {
            name: name,
            third_serial_number: mac,
            manufacturer: 'Tasmota',
            model,
            firmware_version: sw_version,
            display_category: display_category,
            capabilities: capabilities,
            state: state,
            tags,
            service_address: createDeviceServiceAddr(mac),
        }

        params.event.payload.endpoints.push(syncDevice);
    }

    return params;
}


/**
 * @description 同步单个设备
 * @export
 * @param {Request} req
 * @param {Response} res
 * @returns {*} 
 */
export default async function syncOneDevice(req: Request, res: Response) {
    try {
        const { mac: userMac } = req.params;

        const deviceSettingList = getDeviceSettingList();

        // 检查设备mac是否合法
        const deviceSetting = deviceSettingList.find(setting => setting.mac === userMac);
        if (!deviceSetting) {
            logger.error(`[syncOneDevice] device id ${userMac} is not exist in device list`);
            return res.json(toResponse(1301));
        }

        if (deviceSetting.display_category === EDeviceType.UNKNOWN) {
            logger.error(`[syncOneDevice] unknown device ${userMac} is not allowed to sync`);
            return res.json(toResponse(1302));
        }

        // 检查设备是否已经同步
        const result = await getIHostSyncDeviceList();
        if (result.error === 401 || result.error === 400) {
            logger.error(`[syncOneDevice] iHost token invalid`)
            await db.setDbValue('iHostToken', '');
            return res.json(toResponse(602));
        } else if (result.error !== 0) {
            logger.error(`[syncOneDevice] get iHost device list failed => ${JSON.stringify(result)}`)
            return res.json(toResponse(500));
        }
        const deviceList = result.data!.device_list;

        if (checkTasmotaDeviceInIHost(deviceList, userMac)) {
            return res.json(toResponse(0));
        }

        // 生成请求参数
        const params = generateIHostDevice([deviceSetting]);
        logger.info(`[syncDevice] sync device to iHost params ${JSON.stringify(params)}`);

        // 开始同步
        const syncRes = await syncDeviceToIHost(params);

        if (!syncRes) {
            logger.error('[syncDevices] sync device to iHost fail----------------------');
            return res.json(toResponse(500));
        }

        if (syncRes?.payload.description === 'headers.Authorization is invalid') {
            logger.info('[syncDevices] sync iHost device,iHost token useless-------------------------clear');
            await db.setDbValue('iHostToken', '');
            return res.json(toResponse(602));
        }

        if (syncRes?.payload.type === 'INVALID_PARAMETERS') {
            logger.error(`[syncDevices] sync device to iHost error params------------------ ${JSON.stringify(params)} ${JSON.stringify(syncRes)}`);
            //参数错误
            return res.json(toResponse(500));
        }

        const { mac } = deviceSetting;
        SSE.send({
            name: ESseEvent.SYNC_SUCCESS_REPORT,
            data: {
                successList: [mac]
            }
        })

        return res.json(toResponse(0));
    } catch (error: any) {
        logger.error(`get MQTT Broker error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
