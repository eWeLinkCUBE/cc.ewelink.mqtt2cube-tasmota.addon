import request from './request';
import _ from 'lodash';

export interface IBroker {
    host: string; // 主机/IP
    port: string; // 端口号
    username: string; // 用户名
    pwd: string; // 用户密码
}

// 获取设备列表
export async function getDevices() {
    return await request.httpGet('devices', {});
}

// 开关新增设备自动同步
export async function autoSync(params: { autoSync: boolean }) {
    return await request.httpPut('auto-sync', params);
}

// 获取设备自动同步开关状态
export async function getAutoSync() {
    return await request.httpGet('auto-sync', {});
}

// 同步所有设备
export async function syncAll() {
    return await request.httpPut('devices', {});
}

// 同步单个设备
export async function syncSingle(id: string) {
    return await request.httpPut(`device/${id}`, {});
}

// 取消同步
export async function unsyncSingle(id: string) {
    return await request.httpPut(`device/${id}/un-sync`, {});
}

// 获取凭证接口
export async function getToken() {
    return await request.httpGet('token', {});
}

// 获取MQTT Broker配置
export async function getMqtt() {
    return await request.httpGet('mqtt', {});
}

// 配置MQTT Broker
export async function setMqtt(params: IBroker) {
    return await request.httpPost('mqtt', params);
}
