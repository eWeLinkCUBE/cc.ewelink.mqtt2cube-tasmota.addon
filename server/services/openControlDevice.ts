import _ from 'lodash';
import { Request, Response } from 'express';
import { TAG_DATA_NAME } from '../const';
import { IIHostControl } from '../ts/interface/IIHostControl';
import { IState } from '../ts/interface/ISwitch';
import { getDeviceSettingList } from '../utils/tmp';
import EDeviceType from '../ts/enum/EDeviceType';
import { getMQTTClient } from '../ts/class/mqtt';
import logger from '../log';


/**
 * @description 开放接口，控制设备
 * @export
 * @param {Request} req
 * @param {Response} res
 * @returns {*} 
 */
export default async function openControlDevice(req: Request, res: Response) {
    const reqData = req.body as unknown as IIHostControl;
    logger.info(`[openControlDevice] I'm in openControlDevice now ${JSON.stringify(reqData)}`)
    const { header, endpoint, payload } = reqData.directive;
    const { message_id } = header;

    try {
        const iHostState = payload.state as IState;
        const mac = _.get(endpoint, ["tags", TAG_DATA_NAME, 'deviceId']);
        const mqttClient = await getMQTTClient();

        if (!mqttClient) {
            logger.error(`[openControlDevice] mqtt client doesn't exist`);
            return;
        }

        const deviceSettingList = getDeviceSettingList();
        const toggleCount = Object.keys(iHostState.toggle!).length;
        const channelLength = toggleCount === 0 ? 1 : toggleCount;
        logger.info(`[openControlDevice] channelLength => ${channelLength}`);
        for (const deviceSetting of deviceSettingList) {
            if (deviceSetting.mac === mac && deviceSetting.display_category === EDeviceType.SWITCH) {
                const { mqttTopics } = deviceSetting;
                if (channelLength === 1) {
                    const powerState = iHostState.power.powerState;
                    const publishRes = await mqttClient.publish(`${mqttTopics.command_topic}/POWER`, powerState);
                    if (publishRes === 0) {
                        logger.error(`publish mqtt topic failed!`);
                        return res.json(createFailRes(message_id));
                    }
                    continue;
                }

                for (let i = 1; i <= channelLength; i++) {
                    const powerState = iHostState.toggle![i].toggleState;
                    const publishRes = await mqttClient.publish(`${mqttTopics.command_topic}/POWER${i}`, powerState);
                    if (publishRes === 0) {
                        logger.error(`publish mqtt topic failed!`);
                        return res.json(createFailRes(message_id));
                    }
                }

                deviceSetting.state = iHostState;
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
            payload: {},
        },
    };
}


/** 等待时间 单位 ms */
function sleepMs(ms: number) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('');
        }, ms);
    });
}
