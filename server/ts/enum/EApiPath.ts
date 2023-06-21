/** 接口路径 */
enum EApiPath {
    /** 配置MQTT Broker */
    SET_MQTT_BROKER = '/mqtt',
    /** 获取 MQTT Broker 配置 */
    GET_MQTT_BROKER = '/mqtt',
    /** 获取设备列表 */
    GET_DEVICE_LIST = '/devices',
    /** 同步单个设备 */
    SYNC_ONE_DEVICE = '/device/:mac',
    /** 同步所有设备 */
    SYNC_ALL_DEVICES = '/devices',
    /** 取消同步单个设备 */
    UN_SYNC_ONE_DEVICE = '/device/:mac/un-sync',
    /** iHost控制设备回调 */
    OPEN_CONTROL_DEVICE = '/open/device/:mac',
    /** 获取设备自动同步开关状态(1500) */
    GET_AUTO_SYNC_STATUS = '/auto-sync',
    /** 开关新增设备自动同步 */
    CHANGE_AUTO_SYNC_STATUS = '/auto-sync',
    /** 获取凭证 */
    GET_IHOST_TOKEN = '/token',
    /** sse */
    SSE = '/sse',
}

export default EApiPath;
