import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import db from '../utils/db';


/**
 * @description 修改自动同步按钮状态
 * @export
 * @param {Request} req
 * @param {Response} res
 * @returns {*} 
 */
export default async function changeIsAutoSyncStatus(req: Request, res: Response) {
    try {
        const { autoSync } = req.body;
        // 校验是否已经获取过token
        const iHostToken = await db.getDbValue('iHostToken'); 
        if(!iHostToken) {
            return res.json(toResponse(602));
        }
        await db.setDbValue('autoSync', autoSync);
        return res.json(toResponse(0));
    } catch (error: any) {
        logger.error(`get iHost token code error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
