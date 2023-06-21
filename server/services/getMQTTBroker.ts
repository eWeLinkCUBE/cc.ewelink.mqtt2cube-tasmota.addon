import _ from 'lodash';
import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import db from '../utils/db';


/**
 * @description 获取MQTT Broker信息
 * @export
 * @param {Request} req
 * @param {Response} res
 * @returns {*} 
 */
export default async function getMQTTBroker(req: Request, res: Response) {
    try {
        const mqttSetting = await db.getDbValue('mqttSetting');

        if (!mqttSetting) {
            logger.error(`[getMQTTBroker] mqttSetting is not properly initiate! ${mqttSetting}`);
            return res.json(toResponse(0, 'success', {}));
        }
        const { username, pwd } = mqttSetting;
        logger.debug(`[getMQTTBroker] current mqttSetting is ${JSON.stringify(mqttSetting)}`);

        if (!username && !pwd) {
            return res.json(toResponse(0, 'success', _.omit(mqttSetting, 'username', 'pwd')));
        }

        return res.json(toResponse(0, 'success', mqttSetting));
    } catch (error: any) {
        logger.error(`get MQTT Broker error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
