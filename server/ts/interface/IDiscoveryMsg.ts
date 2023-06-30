import ERelayType from "../enum/ERelayType";

/** 发现设备的信息 */
export interface IDiscoveryMsg {
    /** 设备ip */
    ip: string;
    /** device name 设备名称 */
    dn: string;
    /** friendly name */
    fn: (null | string)[];
    /** host name 主机名称 */
    hn: string;
    /** mac */
    mac: string;
    /** model */
    md: string;
    /** TUYA */
    ty: number;
    /** IFan */
    if: number;
    /** offline 离线信息 */
    ofln: string;
    /** online 在线信息 */
    onln: string;
    /** state列表 */
    state: string[];
    /** software version tasmota版本 */
    sw: string;
    /** topic */
    t: string;
    /** fullTopic */
    ft: string;
    /** topic prefix topic前缀 */
    tp: string[];
    /** relay列表 0=none 1=relay 2=light 3=shutter */
    rl: ERelayType[];
    /** switch */
    swc: number[];
    /** switch name */
    swn: null[];
    /** button */
    btn: number[];
    /** setOption列表 */
    so: ISetOptions;
    /** Link Rgb CT | RGB + white channels linked to a single light */
    lk: number;
    /** light subtype */
    lt_st: number;
    /** shutter options */
    sho: number[];
    /** shutter tilt */
    sht: number[][];
    /** version */
    ver: number;
}

/** 会影响discovery的部分配置 */
export interface ISetOptions {
    /** Return MQTT response as RESULT or %COMMAND% */
    '4': number;
    /** Swap button single and double press functionality */
    '11': number;
    /** Allow immediate action on single button press */
    '13': number;
    /** Show Color string as hex or comma-separated */
    '17': number;
    /** Update of Dimmer/Color/CT without turning power on */
    '20': number;
    /** Enforce Home Assistant auto-discovery as light */
    '30': number;
    /** Multi-channel PWM instead of a single light */
    '68': number;
    /** Enable Buttons decoupling and send multi-press and hold MQTT messages */
    '73': number;
    /** Reduce the CT range from 153..500 to 200.380 */
    '82': number;
    /** Enable sending switch MQTT messages */
    '114': number;
    /** Run fading at fixed duration instead of fixed slew rate */
    '117': number;
}