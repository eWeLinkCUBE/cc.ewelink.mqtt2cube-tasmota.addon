enum ESseEvent {
    /** 同步成功事件 */
    SYNC_SUCCESS_REPORT = 'sync_success_report',
    /** 取消同步事件 */
    UN_SYNC_REPORT = 'un_sync_report',
    /** mqtt连接成功事件 */
    MQTT_CONNECTED_REPORT = 'mqtt_connected_report',
    /** mqtt连接失败事件 */
    MQTT_DISCONNECT_REPORT = 'mqtt_disconnect_report',
    /** 新增设备事件 */
    NEW_DEVICE_REPORT = 'new_device_report',
    /** 设备名称更改事件 */
    DEVICE_NAME_CHANGED_REPORT = 'device_name_changed_report',
    /** 设备上下线状态变更事件 */
    DEVICE_ONLINE_STATUS_REPORT = 'device_online_status_report'
}

export default ESseEvent;