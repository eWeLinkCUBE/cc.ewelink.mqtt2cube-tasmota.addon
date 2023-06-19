import { ISwitch } from "../ts/interface/ISwtich"

interface IDeviceSetting {
    switch: ISwitch
}


const DEVICE_SETTINGS: IDeviceSetting = {
    switch: {
        display_category: "switch",
        name: "",
        capability: [],
        state: {
            power: {
                powerState: "off"
            }
        },
        mac: "",
        poll_topic: "",
        availability_topic: "",
        availability_offline: "",
        availability_online: "",
        command_topic: "",
        result_topic: "",
        state_power_off: "",
        state_power_on: "",
        state_topic: "",
        fallback_topic: "",
        sw_version: ""
    }
}


/**
 * @description 根据类别生成一个空白的开关信息对象
 * @param {keyof IDeviceSetting} deviceType
 * @returns {*}  {ISwitch}
 */
export default function generateDeviceSetting(deviceType: keyof IDeviceSetting): ISwitch {
    return DEVICE_SETTINGS[deviceType];
}