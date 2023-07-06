import _ from 'lodash';
import logger from '../log';

const ERROR_LIST = [
    {
        errCode: 0,
        errMsg: 'Success'
    },
    {
        errCode: 500,
        errMsg: 'Internel Error'    // 服务端内部错误
    },
    {
        errCode: 601,
        errMsg: 'iHost no response'    // iHost unreachable
    },
    {
        errCode: 602,
        errMsg: 'token invalid'    // iHost 凭证无效
    },
    {
        errCode: 603,
        errMsg: 'mqtt disconnect'    // mqtt 断连
    },
    {
        errCode: 1001,
        errMsg: 'mqtt setting is invalid',   // mqtt配置有误
    },
    {
        errCode: 1101,
        errMsg: 'mqtt not set yet',   // 尚未配置mqtt
    },
    {
        errCode: 1301,
        errMsg: 'device id invalid',   // 设备id无效
    },
    {
        errCode: 1302,
        errMsg: 'unknown device is not allowed to sync',   // 不支持设备不允许同步
    },
    {
        errCode: 1701,
        errMsg: 'no token yet',   // 还未获取到凭证
    },
    {
        errCode: 1801,
        errMsg: 'device id invalid',   // 该设备不存在
    },
    {
        errCode: 1802,
        errMsg: 'device is not exist in iHost',   // 该设备已经存在iHost中
    }
];

export function toResponse(error: number, msg?: string, data?: any) {
    const found = _.find(ERROR_LIST, { errCode: error });
    let result = null;
    if (found) {
        result = {
            error: found.errCode,
            msg: msg || found.errMsg,
            data
        };
    } else {
        result = {
            error: 500,
            msg: msg || 'Internal Error',
            data
        };
    }
    logger.info(`(toResponse) result: ${JSON.stringify(result)}`);
    return result;
}
