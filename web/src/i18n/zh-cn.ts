const cn = {
    ERROR: {
        500: '操作失败，请稍后重试',
    },
    DEVICE_LIST_TITLE: '设备列表',
    AUTO_SYNC_TIP: '新增设备自动同步',
    DEVICE_LIST_UNSUPPORTED_TIP: '暂不支持该设备',
    DEVICE_OFFLINE: '离线',
    SYNC: '同步',
    CANCELING_SYNC: '取消同步',
    NO_DATA: '暂无数据',
    SYNCING_ALL_DEVICE_TIP: '正在同步所有设备，请稍等',
    DEVICE_LIST_DISCONNECT_TIP: 'MQTT broker 无法连接，请点击设置重新配置 MQTT broker',
    SETTINGS_HEADER_TITLE: '设置',
    SETTINGS_BODY_TITLE: '配置 MQTT broker',
    SETTINGS_DESCRIPTION:
        '控制tasmota 设备需要 MQTT broker 做 MQTT 指令转发，请完成以下配置连接您的 MQTT broker，若您还没有 MQTT broker，可在 ihost 中安装 mosquitto add-on 作为您的 MQTT broker',
    SETTINGS_SAVE_SUCCESS: '保存成功',
    SETTINGS_SAVE_VALIDATE_LACK: '主机和端口号不能为空',
    SETTINGS_SAVE_VALIDATE_PORT_NUMBER: '端口需为数字',
    SETTINGS_FORM: {
        HOST: '域名 / IP',
        PORT: '端口',
        USERNAME: '用户名',
        PASSWORD: '密码',
    },
    SETTINGS_PLACEHOLDER: {
        HOST: 'MQTT broker 的域名/ ip，建议使用域名',
        PORT: 'MQTT broker 的端口',
        USERNAME: 'MQTT broker 用户名（如果您有设置用户名）',
        PASSWORD: 'MQTT broker 密码（如果您有设置密码）',
    },
    GET_ACCESS_TOKEN_TIP_TITLE: '同步设备前须获取token，获取方式如下',
    GET_ACCESS_TOKEN_TIP1: ' 请前往iHost中控台点击"获取凭证弹框"的"确认"按钮',
    GET_ACCESS_TOKEN_TIP2: ' 返回该页面点击"完成"按钮',
    FINISH: '完成',
    CANCEL: '取消',
    SAVE: '保存',
    GET_TOKEN_ERROR: '获取凭证失败，请重试',
};

export default cn;
