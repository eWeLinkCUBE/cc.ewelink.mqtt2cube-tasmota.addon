import _ from 'lodash';
import ping from 'ping';
import logger from '../log';

/**
 *
 * 睡眠函数
 * @date 18/05/2023
 * @param {number} time
 */
function sleep(time: number) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(1);
        }, time)
    })
}


/**
 * @description 判断该ip是否还存活
 * @param {string} ip
 * @returns {*}  {Promise<boolean>}
 */
async function isIpAlive(ip: string): Promise<boolean> {
    const res = await ping.promise.probe(ip);
    logger.debug(`ping ${ip} result ${JSON.stringify(res)}`);
    return res.alive;
}


export default {
    sleep,
    isIpAlive
}
