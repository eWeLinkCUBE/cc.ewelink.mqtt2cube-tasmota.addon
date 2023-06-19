/** 接口路径 */
enum EApiPath {
    /** 1、配置MQTT Broker */
    SET_MQTT_BROKER = '/mqtt',
    /** 2、获取 MQTT Broker 配置 */
    GET_MQTT_BROKER = '/mqtt',
    /** 3、获取设备列表 */
    GET_DEVICE_LIST = '/devices',
    /** 4、同步单个设备 */
    SYNC_ONE_DEVICE = '/device/:mac',
    /** 5、同步所有设备 */
    SYNC_ALL_DEVICES = '/devices',
    /** 6、取消同步单个设备 */
    UN_SYNC_ONE_DEVICE = '/device/:mac/un-sync',
    /** 7、iHost控制设备回调 */
    OPEN_CONTROL_DEVICE = '/open/device/:mac',
}

export default EApiPath;
