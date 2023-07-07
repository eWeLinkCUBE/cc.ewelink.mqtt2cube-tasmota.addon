import _ from 'lodash';
import { Request, Response, NextFunction } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import { getMQTTConnected } from '../utils/tmp';


/**
 * @description 判断mqtt是否存活
 * @export
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {*} 
 */
export async function checkMQTTAlive(req: Request, res: Response, next: NextFunction) {
    const url = req.url;

    // 判断是否为mqtt相关接口
    const mqttApi = url.includes('/api/v1/mqtt');
    // 判断是否为sse相关接口
    const sseApi = url.includes('/api/v1/sse');
    // 判断是否为开放接口
    const openApi = url.includes('/api/v1/open/device');
    // mqtt是否连接中
    const mqttConnected = getMQTTConnected();

    if (!mqttApi && !sseApi && !mqttConnected && !openApi) {
        logger.info(`[checkMQTTAlive middleware] mqtt is not connected`);
        return res.json(toResponse(603));
    }

    return next();
}
