import Axios from 'axios';
import _ from 'lodash';
import { MD5 } from 'crypto-js';
import { APPID, BASE_API_URL, APP_SECRET } from '@/config';
import { message } from 'ant-design-vue';

enum EHttpMethod {
    GET = 'get',
    POST = 'post',
    PUT = 'put',
}

export interface IResponseResult {
    error: number;
    msg?: string;
    data: any;
}
const TIME_OUT = 60000;

function _createCommonHeader() {
    return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        sign: '',
        authorization: '',
    };
}

function _createSign(params: any) {
    let signStr = '';

    const keys = Object.keys(params).sort();
    // console.log('🚀 ~ file: request.ts ~  keys', keys);

    keys.forEach((key) => {
        const paramsValue = _.get(params, key);
        const value = paramsValue instanceof Object ? JSON.stringify(paramsValue) : paramsValue;
        signStr += `${key}${value}`;
    });
    // console.log("🚀 ~ file: signStr", signStr);

    signStr = MD5(`${APP_SECRET}${encodeURIComponent(signStr)}${APP_SECRET}`)
        .toString()
        .toUpperCase();

    return signStr;
}

async function httpPost<T>(url: string, params: object) {
    return _httpRequest<T>(url, params, EHttpMethod.POST);
}

async function httpGet<T>(url: string, params: object) {
    return _httpRequest<T>(url, params, EHttpMethod.GET);
}

async function httpPut<T>(url: string, params: object) {
    return _httpRequest<T>(url, params, EHttpMethod.PUT);
}

async function _httpRequest<T>(api: string, params: any, httpMethod: EHttpMethod): Promise<IResponseResult> {
    try {
        // 添加通用参数
        params = {
            appid: APPID,
            ts: `${Date.now()}`,
            ...params,
        };

        // 添加 sign 验证
        let headers = _createCommonHeader();
        const sign = _createSign(params);
        headers['sign'] = `Sign ${sign}`;

        let result: any = {};

        const url = `${BASE_API_URL}/${api}`;

        if (httpMethod === EHttpMethod.GET) {
            result = await Axios.get<T>(url, {
                headers,
                timeout: TIME_OUT,
                params,
            });
        } else if (httpMethod === EHttpMethod.POST) {
            result = await Axios.post<T>(url, params, {
                headers,
                timeout: TIME_OUT,
            });
        } else {
            result = await Axios.put<T>(url, params, {
                headers,
                timeout: TIME_OUT,
            });
        }
        const { data } = result;
        return data;
    } catch (error) {
        const response: IResponseResult = {
            error: 500,
            data: null,
        };
        console.log('request error', error);
        return response;
    }
}

export default {
    httpPost,
    httpGet,
    httpPut,
};
