import mqtt from 'mqtt';

export interface IMqttParams {
    /** 主机，可为端口或域名 */
    host: string;
    /** 端口号 */
    port: string;
    /** 用户名 */
    username?: string;
    /** 密码 */
    pwd?: string;
}


export interface IMqttReceiveEvent<T> {
    /** topic */
    topic: string;
    /** topic payload */
    data: T;
    /** topic packet */
    packet: mqtt.IPublishPacket
}


export interface IStateTopic {
    Time: string;
    Uptime: string;
    UptimeSec: number;
    Heap: number;
    SleepMode: string;
    Sleep: number;
    LoadAvg: number;
    MqttCount: number;
    POWER: string;
    POWER1: string;
    POWER2: string;
    POWER3: string;
    POWER4: string;
    Wifi: Wifi;
}
interface Wifi {
    AP: number;
    SSId: string;
    BSSId: string;
    Channel: number;
    Mode: string;
    RSSI: number;
    Signal: number;
    LinkCount: number;
    Downtime: string;
}