import _ from 'lodash';
import { Request, Response } from 'express';
import { TAG_DATA_NAME } from '../const';
import { IIHostControl } from '../ts/interface/IIHostControl';
import { IState } from '../ts/interface/ISwitch';
import { getDeviceSettingList, getMQTTConnected } from '../utils/tmp';
import EDeviceType from '../ts/enum/EDeviceType';
import { getMQTTClient } from '../ts/class/mqtt';
import logger from '../log';
import { getSwitchChannel } from '../utils/device';


/**
 * @description 开放接口，控制设备
 * @export
 * @param {Request} req
 * @param {Response} res
 * @returns {*} 
 */
export default async function openControlDevice(req: Request, res: Response) {
    const reqData = req.body as unknown as IIHostControl;
    const { header, endpoint, payload } = reqData.directive;
    const { message_id } = header;

    try {
        const iHostState = payload.state as IState;
        const mac = _.get(endpoint, ["tags", TAG_DATA_NAME, 'deviceId']);

        const mqttConnected = getMQTTConnected();
        if(!mqttConnected) {
            logger.error(`[openControlDevice] mqtt is not connected`);
            return res.json(createFailRes(message_id));
        }

        const mqttClient = await getMQTTClient();

        if (!mqttClient) {
            logger.error(`[openControlDevice] mqtt client doesn't exist`);
            return res.json(createFailRes(message_id));
        }

        const deviceSettingList = getDeviceSettingList();
        for (const deviceSetting of deviceSettingList) {
            // 对开关设备进行处理
            if (deviceSetting.mac === mac && deviceSetting.display_category === EDeviceType.SWITCH) {
                const channelLength = getSwitchChannel(deviceSetting);
                const { mqttTopics } = deviceSetting;
                // 单通道设备
                if (channelLength === 1) {
                    const powerState = iHostState.power.powerState;
                    const publishRes = await mqttClient.publish(`${mqttTopics.command_topic}POWER`, powerState);
                    if (publishRes === 0) {
                        logger.error(`publish mqtt topic failed!`);
                        return res.json(createFailRes(message_id));
                    }
                    continue;
                }

                // 多通道设备
                for (let i = 1; i <= channelLength; i++) {
                    const toggleObj = _.get(iHostState, ['toggle', `${i}`, 'toggleState']);
                    const powerObj = _.get(iHostState, ['power', 'powerState']);
                    if (!toggleObj && !powerObj) continue;
                    const power = toggleObj || powerObj;
                    const publishRes = await mqttClient.publish(`${mqttTopics.command_topic}POWER${i}`, power);
                    if (publishRes === 0) {
                        logger.error(`publish mqtt topic failed!`);
                        return res.json(createFailRes(message_id));
                    }
                }

                deviceSetting.state = _.merge(deviceSetting.state, iHostState);
            }
        }

        logger.info(`[openControlDevice] open control device success`);

        return res.json(createSuccessRes(message_id));

    } catch (error: any) {
        return res.json(createFailRes(message_id));
    }
};



function createSuccessRes(message_id: string) {
    return {
        event: {
            header: {
                name: 'UpdateDeviceStatesResponse',
                message_id,
                version: '1',
            },
            payload: {},
        },
    };
}

function createFailRes(message_id: string) {
    return {
        event: {
            header: {
                name: 'ErrorResponse',
                message_id,
                version: '1',
            },
            payload: {
                type: "ENDPOINT_UNREACHABLE"
            },
        },
    };
}
