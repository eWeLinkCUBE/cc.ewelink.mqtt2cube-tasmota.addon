import fs from 'fs';
import path from 'path';
import express from 'express';
import logger from './log';
import info from './middleware/info';
import router from './routes';
import { internalError, notFound } from './middleware/error';
import config from './config';
import db, { initDb } from './utils/db';
import oauth from './middleware/oauth';
import _ from 'lodash';
import { initMqtt } from './ts/class/mqtt';
import { checkMQTTAlive } from './middleware/checkMQTTAlive';

const app = express();
const port = config.nodeApp.port;

// 配置持久化所需文件
const dataPath = path.join(__dirname, 'data');
const dbPath = path.join(__dirname, 'data', 'db.json');
const versionPath = path.join(__dirname, 'version');

config.nodeApp.dataPath = dataPath;
config.nodeApp.dbPath = dbPath;

if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath);
}

const isDbFileExist = fs.existsSync(dbPath);

// 获取当前版本号
config.nodeApp.version = fs.existsSync(versionPath) ? fs.readFileSync(versionPath).toString() : '0.0.1';

// 将body解析为json格式
app.use(express.json());

// 加载静态文件
app.use(express.static(path.join(__dirname, 'public')));

// 记录传入参数
app.use(info);

// 鉴权校验
app.use(oauth);

// 检查MQTT有效性
app.use(checkMQTTAlive);

// 路由处理
app.use('/api/v1', router);

// 错误处理
app.use(notFound);
app.use(internalError);

app.listen(port, '0.0.0.0', async () => {
    logger.info(`Server is running at [port: ${port}----env: ${config.nodeApp.env}----version: v${config.nodeApp.version}`);
    // 初始化数据库
    await initDb(dbPath, isDbFileExist);
    const mqttSetting = await db.getDbValue('mqttSetting');
    if (mqttSetting) {
        await initMqtt(mqttSetting);
    }

});
