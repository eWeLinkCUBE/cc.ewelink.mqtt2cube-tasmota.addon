import EDeviceType from "../enum/EDeviceType";
import { ISetOptions } from "./IDiscoveryMsg";

export interface INotSupport {
    /** 类别 */
    display_category: EDeviceType.UNKNOWN;
    /** 设备名称 tasmota_config.dn*/
    name: string;
    /** 在线离线状态 */
    online: boolean;
    /** model */
    model: string,
    /** mac地址 tasmota_config.mac */
    mac: string;
    mqttTopics: {
        /** topic */
        topic: string;
        /** 在线离线状态topic LWT-TOPIC-BY-CONFIG */
        availability_topic: string;
        /** 离线内容 tasmota_config.ofln */
        availability_offline: string;
        /** 在线内容 tasmota_config.onln */
        availability_online: string;
        /** fallback topic */
        fallback_topic: string;
    },
    /** setOption列表 */
    so: ISetOptions;
    /** 软件，即Tasmota版本 tasmota_config.sw */
    sw_version: string
}