export const devConf = {
    nodeApp: {
        env: 'dev',
        port: 8325,
        dataPath: '',
        dbPath: '',
        name: 'Tasmota-Addon',
        version: '0.0.1',
    },
    auth: {
        appId: 'IZCOQAdJ5pCItYrh',
        appSecret: 'zpt5vuh#bl#HXvgwdShPoxakYN3q3F1e',
    },
    iHost: {
        api: 'http://192.168.31.214/open-api/v1/rest',
    },
    log: {
        path: 'log/logFile/total_dev.log',
        pattern: '-yyyy-MM-dd.log',
    },
    /** 启动的ip */
    localIp: 'http://localhost:8325',
    /** 获取网关凭证的等待时长 (ms) */
    getGatewayTokenTimeout: 300000,
};
