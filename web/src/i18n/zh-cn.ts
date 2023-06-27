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
    SYNC_SUCCESS: '同步成功',
    CANCEL_SYNC_SUCCESS: '取消同步成功',
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
    SETTINGS_TIP_MODAL: {
        MAIN_TITLE: 'Tasmota add-on 可将您的 tasmota 设备同步到 iHost 进行控制.',
        PREPARE_WORK: {
            TITLE: '使用 tasmota 请确认已提前做好准备工作：',
            STEP1: '您的设备已经刷好 tasmota 固件。',
            STEP2: '请确保设备的 Configuration>Configure Other 中的 MQTT Enable 已经勾选。',
            STEP3: '一个就绪的 MQTT broker，您也可以在 iHost 中安装一个 MQTT broker 。例如：mosquitto',
            STEP4: '确认设备的 setOption 19 设为 0，',
            DOC_LINK: '参考文档>',
        },
        SUPPORTED_DEVICE: {
            TITLE: '目前支持的设备类别：',
            CONTENT: '开关、插座',
        },
        FOOTER_TIP: '完成准备工作后请点击确认按钮进入下一步配置 MQTT broker。',
        CONFIRM: '确认',
    },
    GET_ACCESS_TOKEN_TIP_TITLE: '同步设备前须获取token，获取方式如下',
    GET_ACCESS_TOKEN_TIP1: ' 请前往iHost中控台点击"获取凭证弹框"的"确认"按钮',
    GET_ACCESS_TOKEN_TIP2: ' 返回该页面点击"完成"按钮',
    FINISH: '完成',
    CANCEL: '取消',
    SAVE: '保存',
    GET_TOKEN_ERROR: '获取凭证失败，请重试',
    DEVICE_SYNC_SUCCESS: '{number} 个设备同步成功',
};

export default cn;
