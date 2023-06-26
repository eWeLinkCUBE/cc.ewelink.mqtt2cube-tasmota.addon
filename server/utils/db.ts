import _ from 'lodash';
import config from '../config';
import logger from '../log';
import KeyV from 'keyv';
import { KeyvFile } from 'keyv-file';
import encryption from './encryption';
import { IMqttParams } from '../ts/interface/IMqtt';

let store: KeyV | null = null;

/**
 * 程序等待 ms 的时间
 *
 * @param ms 等待的时长
 */
export function wait(ms: number) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, ms);
    });
}


export async function initDb(filename: string, isDbFileExist: boolean) {
    // create store object
    store = new KeyV({
        store: new KeyvFile({
            filename,

            // encode function
            encode: (val: any) => {
                return encryption.encryptAES(JSON.stringify(val), config.auth.appSecret);
            },
            // encode: JSON.stringify,

            // decode function
            decode: (val: any) => {
                try {
                    const decryptStr = encryption.decryptAES(val, config.auth.appSecret);
                    return JSON.parse(decryptStr);
                } catch (err) {
                    logger.info('[decode info error]', err);
                    return null;
                }
            },
            // decode: JSON.parse
        }),
    });

    // first init should init data
    if (!isDbFileExist) {
        for (const key of Object.keys(dbDataTmp)) {
            await store.set(key, dbDataTmp[key as keyof IDbData]);
        }
    }
}

type DbKey = keyof IDbData;

interface IDbData {
    /** mqtt配置信息 */
    mqttSetting: null | IMqttParams;
    /** iHost 凭证 */
    iHostToken: string;
    /** 是否开启自动同步，默认为false */
    autoSync: boolean;
}

export const dbDataTmp: IDbData = {
    mqttSetting: null,
    iHostToken: "",
    autoSync: false
};

/** 获取所有数据 */
async function getDb() {
    if (!store) return;
    try {
        const res = {};
        for (const key of Object.keys(dbDataTmp)) {
            const curVal = await store.get(key);
            _.assign(res, {
                [key]: curVal,
            });
        }
        return res as IDbData;
    } catch (error) {
        logger.error('get db file---------------', 'error-----', error);
        return null as unknown as IDbData;
    }
}

/** 清除所有数据 */
async function clearStore() {
    if (!store) return;
    await store.clear();
}

/** 设置指定的数据库数据 */
async function setDbValue(key: 'mqttSetting', v: IDbData['mqttSetting']): Promise<void>;
async function setDbValue(key: 'autoSync', v: IDbData['autoSync']): Promise<void>;
async function setDbValue(key: 'iHostToken', v: IDbData['iHostToken']): Promise<void>;
async function setDbValue(key: DbKey, v: IDbData[DbKey]) {
    if (!store) return;
    await store.set(key, v);
}

/** 获取指定的数据库数据 */
async function getDbValue(key: 'mqttSetting'): Promise<IDbData['mqttSetting']>;
async function getDbValue(key: 'autoSync'): Promise<IDbData['autoSync']>;
async function getDbValue(key: 'iHostToken'): Promise<IDbData['iHostToken']>;
async function getDbValue(key: DbKey) {
    if (!store) return null;
    const res = await store.get(key);
    return res;
}

export default {
    getDb,
    clearStore,
    setDbValue,
    getDbValue,
};
