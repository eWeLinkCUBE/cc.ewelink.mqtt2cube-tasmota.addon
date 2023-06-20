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
        errCode: 1201,
        errMsg: 'IP can not connect',   // IP 地址无法连接
    },
    {
        errCode: 1202,
        errMsg: 'IP can not connect',   // IP 地址无法连接
    },


    {
        errCode: 1101,
        errMsg: 'IP can not connect',   // IP 地址无法连接
    },
    {
        errCode: 1400,
        errMsg: 'NSPro gateway need login'    // NSPro 网关需要登录
    },
    {
        errCode: 1500,
        errMsg: 'No src gateway info'    // 无同步来源网关的信息
    },
    {
        errCode: 1501,
        errMsg: 'Src gateway IP invalid'    // 同步来源网关的 IP 不可用
    },
    {
        errCode: 1502,
        errMsg: 'Src gateway token invalid'    // 同步来源网关的凭证不可用
    },
    {
        errCode: 1503,
        errMsg: 'Sync device not in src gateway'    // 同步设备不在同步来源网关中
    },
    {
        errCode: 1800,
        errMsg: 'Unsync device not found'    // 取消同步的设备不存在
    },
    {
        errCode: 2000,
        errMsg: 'Delete gateway not found'    // 删除的网关不存在
    },
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
