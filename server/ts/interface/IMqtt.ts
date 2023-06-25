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