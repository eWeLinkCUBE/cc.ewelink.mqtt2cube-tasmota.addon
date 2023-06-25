export const prodConf = {
    nodeApp: {
        env: 'prod',
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
        api: 'http://ihost/open-api/v1/rest',
    },
    log: {
        path: 'log/logFile/total_prod.log',
        pattern: '-yyyy-MM-dd.log',
    },
    /** 启动的ip */
    localIp: 'http://ihost:8325',
    /** 获取网关凭证的等待时长 (ms) */
    getGatewayTokenTimeout: 300000,
};
