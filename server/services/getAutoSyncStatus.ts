import { Request, Response } from 'express';
import { toResponse } from '../utils/error';
import logger from '../log';
import db from '../utils/db';


/**
 * @description 自动同步设备按钮状态
 * @export
 * @param {Request} req
 * @param {Response} res
 * @returns {*} 
 */
export default async function getAutoSyncStatus(req: Request, res: Response) {
    try {
        const autoSync = await db.getDbValue('autoSync');
        return res.json(toResponse(0, 'success', { autoSync }));
    } catch (error: any) {
        logger.error(`getAutoSyncStatus code error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
