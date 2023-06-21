import _ from 'lodash';
import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import { initMqtt } from '../ts/class/mqtt';
import db from '../utils/db';


/**
 * @description 配置MQTT Broker信息
 * @export
 * @param {Request} req
 * @param {Response} res
 * @returns {*} 
 */
export default async function setMQTTBroker(req: Request, res: Response) {
    try {
        const { username, pwd, host, port } = req.body;
        const initRes = await initMqtt({ username, pwd, host, port });
        logger.debug(`[setMQTTBroker] init result => ${initRes}`)
        if (!initRes) {
            logger.error(`[setMQTTBroker] mqtt setting is wrong ${JSON.stringify({ username, pwd, host, port })}`)
            return res.json(toResponse(1001));
        }

        await db.setDbValue('mqttSetting', { username, pwd, host, port });

        return res.json(toResponse(0));
    } catch (error: any) {
        logger.error(`[setMQTTBroker] catch error----------------: ${error}`);
        res.json(toResponse(500));
    }
}
