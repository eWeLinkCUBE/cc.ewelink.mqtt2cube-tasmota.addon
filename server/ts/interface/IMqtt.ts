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