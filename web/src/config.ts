const { DEV, MODE } = import.meta.env;
// 运行环境是否为测试环境Api
function isTest(): boolean {
    return DEV || MODE === 'development' ? true : false;
}

const APPID = 'IZCOQAdJ5pCItYrh';
const APP_SECRET = 'zpt5vuh#bl#HXvgwdShPoxakYN3q3F1e';
const BASE_API_URL = isTest() ? 'http://10.244.253.167:8325/api/v1' : '/api/v1';
const SSE_URL = isTest() ? 'http://10.244.253.167:8325/api/v1/sse' : '/api/v1/sse';

export { APPID, APP_SECRET, BASE_API_URL, SSE_URL };
