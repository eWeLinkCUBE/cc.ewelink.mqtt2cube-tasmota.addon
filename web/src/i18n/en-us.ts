const en = {
    ERROR: {
        500: 'Failed, please try later',
    },
    DEVICE_LIST_TITLE: 'Device list',
    AUTO_SYNC_TIP: 'Auto-sync new-added devices',
    DEVICE_LIST_UNSUPPORTED_TIP: 'Not supported yet',
    DEVICE_OFFLINE: 'offline',
    SYNC: 'Sync',
    CANCELING_SYNC: 'Unsync',
    NO_DATA: 'No Data',
    SYNCING_ALL_DEVICE_TIP: 'Syncing all devices, please wait',
    DEVICE_LIST_DISCONNECT_TIP: 'Unable to connect to the MQTT broker. Please click Settings to reconfigure the MQTT broker.',
    SETTINGS_HEADER_TITLE: 'Settings',
    SETTINGS_BODY_TITLE: 'MQTT broker configurations',
    SETTINGS_DESCRIPTION:
        "To control Tasmota devices, an MQTT broker is required for MQTT command forwarding. Please complete the following configurations to connect to your MQTT broker. If you don't have an MQTT broker yet, you can install the Mosquitto Add-on in iHost to serve as your MQTT broker.",
    SETTINGS_SAVE_SUCCESS: 'Success',
    SETTINGS_SAVE_VALIDATE_LACK: 'Please enter the host and port',
    SETTINGS_SAVE_VALIDATE_PORT_NUMBER: 'The port value should be numbers',
    SETTINGS_FORM: {
        HOST: 'Domain name/IP',
        PORT: 'Port',
        USERNAME: 'Username',
        PASSWORD: 'Password',
    },
    SETTINGS_PLACEHOLDER: {
        HOST: 'The domain name/IP address of MQTT broker. It is recommended to use a domain name.',
        PORT: 'Port of your MQTT Port',
        USERNAME: 'The username for the MQTT broker (If you have set one)',
        PASSWORD: 'MQTT broker password (If you have set one)',
    },
    GET_ACCESS_TOKEN_TIP_TITLE: 'Please follow steps below to get iHost access token: ',
    GET_ACCESS_TOKEN_TIP1: ' Enter this Add-on page in iHost dashboard and confirm "Get iHost access token"',
    GET_ACCESS_TOKEN_TIP2: ' Back to current page and click "Complete"',
    FINISH: 'Complete',
    CANCEL: 'Cancel',
    SAVE: 'Save',
    GET_TOKEN_ERROR: 'Failed to get iHost access token, please try again.',
};

export default en;
