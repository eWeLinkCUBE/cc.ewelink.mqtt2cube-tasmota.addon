import EDeviceType from "../enum/EDeviceType"
import { ISetOptions } from "./IDiscoveryMsg"

export type ICapability = IToggleCapability | INormalCapability

interface IToggleCapability {
    capability: "toggle",
    permission: "readWrite",
    name: string
}

interface INormalCapability {
    capability: string,
    permission: "read" | "readWrite"
}

export interface IState {
    power: {
        powerState: "on" | "off"
    },
    toggle?: {
        [propsName: string]: {
            toggleState: "on" | "off"
        }
    }
}

export interface ISwitch {
    /** 类别 */
    display_category: EDeviceType.SWITCH;
    /** 设备名称 tasmota_config.dn*/
    name: string;
    /** 能力 */
    capabilities: ICapability[],
    /** 状态 */
    state: IState,
    /** 在线离线状态 */
    online: boolean,
    /** 设备同步的tags */
    tags: any,
    /** model */
    model: string,
    /** mac地址 tasmota_config.mac */
    mac: string;
    /** mqtt topics */
    mqttTopics: {
        /** topic */
        topic: string;
        /** 查询状态topic COMMAND-FOR_STATE-TOPIC-BY-CONFIG eg: cmnd/tasmota_plug/STATE*/
        poll_topic: string;
        /** 在线离线状态topic LWT-TOPIC-BY-CONFIG */
        availability_topic: string;
        /** 离线内容 tasmota_config.ofln */
        availability_offline: string;
        /** 在线内容 tasmota_config.onln */
        availability_online: string;
        /** 指令topic COMMAND-TOPIC-BY-CONFIG eg: cmnd/tasmota_plug/ */
        command_topic: string;
        /** 指令结果topic RESULT-TOPIC-BY-CONFIG eg: state/tasmota_plug/RESULT*/
        result_topic: string;
        /** 关闭内容 */
        state_power_off: string;
        /** 开启内容 */
        state_power_on: string;
        /** 设备状态上报topic TELE-TOPIC-BY-CONFIG eg: tele/tasmota_plug/STATE*/
        state_topic: string;
        /** 设备状态上报topic 前缀，供so4配置为1时使用 eg: stat/tasmota_plug/ */
        state_topic_all: string;
        /** fallback topic eg: cmnd/DVES_CC263B_fb/*/
        fallback_topic: string;
        /** power状态的topic，只有当so4为1时才会使用 */
        power_topics: string[];
    },
    /** setOption列表 */
    so: ISetOptions;
    /** 软件，即Tasmota版本 tasmota_config.sw */
    sw_version: string
}