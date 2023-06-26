import { Request, Response } from 'express';
import db from '../utils/db';
import { toResponse } from '../utils/error';
import logger from '../log';
import config from '../config';
import { getPermissionApi } from '../cube-api/api';

export default async function getIHostToken(req: Request, res: Response) {
    try {
        const iHostToken = await db.getDbValue('iHostToken');
        if (iHostToken) {
            return res.json(toResponse(0));
        }
        const { error, data } = await getPermissionApi({ app_name: config.nodeApp.name });
        logger.info(`[getPermission] get iHost token res------------------------- ${error} ${JSON.stringify(data)}`);

        if (data?.token) {
            await db.setDbValue('iHostToken', data.token);
        }
        if ([400, 401].includes(error)) {
            logger.error('[getPermission] get iHost token has no auth------------------------', error);
            return res.json(toResponse(1701));
        }

        logger.info('[getPermission] get iHost token------------------------------------------------', data);

        return res.json(toResponse(0, 'success'));
    } catch (error: any) {
        logger.error(`[getPermission] get iHost token code error----------------: ${error.message}`);
        res.json(toResponse(500));
    }
}
