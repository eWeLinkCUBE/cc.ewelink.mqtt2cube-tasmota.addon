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
        await db.setDbValue('autoSync', autoSync);
        return res.json(toResponse(0));
    } catch (error: any) {
        logger.error(`get iHost token code error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
