import _ from 'lodash';
import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import { TDeviceSetting, getDeviceSettingList } from '../utils/tmp';
import EDeviceType from '../ts/enum/EDeviceType';
import { TAG_DATA_NAME } from '../const';
import config from '../config';
import { ISyncDeviceToIHostReq, syncDeviceToIHost } from '../cube-api/api';
import { v4 as uuidv4 } from 'uuid';



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

        const { name, mac, model, sw_version, display_category, capabilities, state } = deviceSetting;
        const syncDevice = {
            name: name,
            third_serial_number: mac,
            manufacturer: 'Tasmota',
            model,
            firmware_version: sw_version,
            display_category: display_category,
            capabilities: capabilities,
            state: state,
            tags: {
                [TAG_DATA_NAME]: {
                    deviceId: mac,
                }
            },
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

        const deviceSetting = deviceSettingList.find(setting => setting.mac === userMac);
        if (!deviceSetting) {
            logger.error(`[syncOneDevice] device id ${userMac} is not exist in device list`);
            return res.json(toResponse(1301));
        }

        if (deviceSetting.display_category === EDeviceType.UNKNOWN) {
            logger.error(`[syncOneDevice] unknown device ${userMac} is not allowed to sync`);
            return res.json(toResponse(1302));
        }

        // 生成请求参数
        const params = generateIHostDevice([deviceSetting]);

        // 开始同步
        const syncRes = await syncDeviceToIHost(params);

        if (!syncRes) {
            logger.error('[syncDevices] sync device to iHost fail----------------------');
            return res.json(toResponse(500));
        }

        if (syncRes?.payload.description === 'headers.Authorization is invalid') {
            logger.info('[syncDevices] sync iHost device,iHost token useless-------------------------clear');
            return res.json(toResponse(602));
        }

        if (syncRes?.payload.type === 'INVALID_PARAMETERS') {
            logger.error(`[syncDevices] sync device to iHost error params------------------ ${JSON.stringify(params)} ${syncRes.payload}`);
            //参数错误
            return res.json(toResponse(500));
        }


        return res.json(toResponse(0));
    } catch (error: any) {
        logger.error(`get MQTT Broker error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
