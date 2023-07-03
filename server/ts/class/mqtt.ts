import db from '../../utils/db';
import { v4 as uuid } from 'uuid';
import logger from '../../log';
import mqttUtils from '../../utils/mqtt';
import mqtt, { IClientOptions, IPublishPacket, IClientSubscribeOptions } from 'mqtt';
import { IMqttParams, IMqttReceiveEvent } from '../interface/IMqtt';
import { getMQTTConnected, updateMQTTConnected } from '../../utils/tmp';
import SSE from './sse';
import { allTasmotaDeviceOnOrOffline } from '../../utils/device';

const MQTT_BROKER_KEEPALIVE = process.env.env === 'dev' ? 5 : 60;

const connectOption: IClientOptions = {
    clientId: '',
    keepalive: MQTT_BROKER_KEEPALIVE,
    clean: true,
    protocolId: 'MQTT',
    protocolVersion: 5,
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000,
    properties: {
        sessionExpiryInterval: 0
    }
};

/**
 * @description MQTT初始化及管理方法
 * @class MQTT
 */
class MQTT {
    /** 初始化参数 */
    initParams: IMqttParams;
    /** 连接定时器 主要用于心跳 */
    connectionTimer: NodeJS.Timer | null;
    /** 已发布的topic */
    publishedTopics: Set<string>;
    /** MQTT客户端实例 */
    client: mqtt.MqttClient | null;
    /** 缓存，存取数据 */
    cache: any;

    constructor(initParams: IMqttParams) {
        this.initParams = initParams;
        this.connectionTimer = null;
        this.publishedTopics = new Set();
        this.client = null;
        this.cache = {};
    }


    /**
     * @description 连接MQTT
     * @returns {*} 
     * @memberof MQTT
     */
    async connect() {
        const { username = "", pwd = "", host, port } = this.initParams
        const mqttUrl = `mqtt://${host}:${port}`;
        logger.error(`[mqtt] Connecting to MQTT server at ${mqttUrl}`);
        let hasInit = false;

        return new Promise((resolve, reject) => {
            const clientId = uuid();
            connectOption.clientId = clientId;

            if (username && pwd) {
                connectOption.username = username;
                connectOption.password = pwd;
            }
            logger.error(`[mqtt] connect option => ${JSON.stringify(connectOption)}`)
            this.client = mqtt.connect(mqttUrl, connectOption);
            this.client.setMaxListeners(0);

            const onConnect = this.#onConnect.bind(this);
            this.client.on('connect', async (packet) => {
                logger.error('[mqtt] connected to MQTT server!!!!', JSON.stringify(packet));
                // logger.error('[mqtt] mqtt is reconnecting');
                await onConnect();
                hasInit = true;
                const mqttConnected = getMQTTConnected();
                if (!mqttConnected) {
                    SSE.send({
                        name: "mqtt_connected_report",
                        data: {}
                    })
                    updateMQTTConnected(true);
                    await allTasmotaDeviceOnOrOffline('online');
                }
                resolve(1);
            });

            this.client.on('reconnect', () => {
                logger.error('[mqtt] mqtt is reconnecting');
            })

            this.client.on('offline', (err: any) => {
                logger.error('[mqtt] mqtt is offline', err);
            })


            this.client.on('close', () => {
                logger.error('[mqtt] mqtt is close');
            })

            this.client.on('end', () => {
                logger.error('[mqtt] mqtt is end');
            })


            this.client.on('disconnect', (packet) => {
                logger.error('[mqtt] mqtt is disconnect', JSON.stringify(packet));
            })

            this.client.on('packetreceive', (packet) => {
                logger.error('[mqtt] mqtt is packetreceive', JSON.stringify(packet));
            })

            this.client.on('packetsend', (packet) => {
                logger.error('[mqtt] mqtt is packetreceive', JSON.stringify(packet));
            })



            this.client.on('error', async (err) => {
                logger.error(`[mqtt] mqtt connect error => ${err.message} ${hasInit}`);
                const mqttConnected = getMQTTConnected();
                if (mqttConnected) {
                    SSE.send({
                        name: "mqtt_disconnect_report",
                        data: {}
                    })
                    updateMQTTConnected(false);
                    await allTasmotaDeviceOnOrOffline('offline');
                }

                if (hasInit) {
                    reject(err);
                    return;
                }

                resolve(0);
            });
            this.client.on('message', this.onMessage.bind(this));
        });
    }


    /**
     * @description 断连MQTT
     * @returns {*} 
     * @memberof MQTT
     */
    disconnect() {
        logger.error(`[mqtt] mqtt disconnect is called!!!!!`)
        return this.client!.end(true);
    }


    /**
     * @description 判断是否已经连接
     * @returns {*} 
     * @memberof MQTT
     */
    isConnected() {
        return this.client && !this.client.reconnecting;
    }

    async #onConnect() {
        // Set timer at interval to check if connected to MQTT server.
        if (this.connectionTimer) {
            clearTimeout(this.connectionTimer);
        }

        this.connectionTimer = setInterval(() => {
            if (this.client!.reconnecting) {
                logger.error('[mqtt] Not connected to MQTT server!');
            }
        }, 10 * 1000);

        await db.setDbValue('mqttSetting', this.initParams);
        logger.info('[mqtt] Connected to MQTT server');

        // 订阅 discovery 信息
        this.subscribe(`tasmota/discovery/#`);
    }

    /**
     * @param {string} topic 
     * @param {string} payload 
     * @param {mqtt.IPublishPacket} packet 
     * @returns 
     */
    async onMessage(topic: string, payload: Buffer, packet: IPublishPacket) {
        logger.info(`[mqtt] onMessage init params`, topic, payload, payload.length);

        if (this.publishedTopics.has(topic)) {
            logger.error("[mqtt] receive same topic as I send it => ", topic, this.publishedTopics);
            return;
        };
        const truePayload = payload.toString();

        const eventData: IMqttReceiveEvent<{}> = {
            topic,
            data: {},
            packet
        };

        try {
            eventData.data = truePayload.length && JSON.parse(truePayload);
        } catch (error) {
            eventData.data = truePayload;
        }

        if (!eventData.data) return;

        // 处理消息
        await mqttUtils.handleMQTTReceiveMsg(eventData);
    }

    /**
     * 订阅topic
     * @param {string} topic 
     * @param {string | object} payload 
     * @param {mqtt.IClientPublishOptions} options 
     * @returns 
     */
    subscribe(topic: string, opt?: IClientSubscribeOptions) {
        if (!topic) return;
        logger.info(`[mqtt] subscribe topic ${topic} ${opt ? 'with option' + opt : ''}`)
        opt = opt ? Object.assign({}, { qos: 2, rap: true }, opt) : { qos: 2, rap: true };
        logger.info(`[mqtt] subscribe topic option ${JSON.stringify(opt)}`)
        this.client!.subscribe(topic, opt);
    }

    /**
     * 取消订阅topic
     * @param {string} topic 
     * @param {string | object} payload 
     * @param {mqtt.IClientPublishOptions} options 
     * @returns 
     */
    unsubscribe(topic: string) {
        if (!topic) return;
        logger.info(`[mqtt] unsubscribe topic ${topic}`)
        this.client!.unsubscribe(topic);
    }

    /**
     * 发布topic
     * @param {string} topic 
     * @param {string | object} payload 
     * @param {mqtt.IClientPublishOptions} options 
     * @returns 
     */
    async publish(topic: string, payload: Buffer | string, options = {}) {
        let sendPayload: Buffer | string = payload;
        const defaultOptions = {
            qos: 1,
            retain: false
        };
        if (!this.isConnected()) {
            logger.error(`Not connected to MQTT server!`);
            return;
        }

        this.publishedTopics.add(topic);

        const actualOptions = { ...defaultOptions, ...options } as IClientSubscribeOptions;
        if (typeof payload === 'object') {
            sendPayload = JSON.stringify(payload);
        };

        logger.info(`publish ==========> `, topic, sendPayload, actualOptions);

        return new Promise((resolve, reject) => {
            this.client!.publish(
                topic,
                sendPayload,
                actualOptions,
                (error) => {
                    if (error) {
                        logger.error(`publish ${topic} error, message is "${error}", opt is ${JSON.stringify(actualOptions)}`);
                        reject(0);
                    } else {
                        resolve(1);
                    }
                });
        });
    }
}


let mqttClient: null | MQTT = null;


/**
 * @description 初始化MQTT连接
 * @export
 * @param {IMqttParams} initParams 初始化信息
 * @returns {*}  {Promise<boolean>}
 */
export async function initMqtt(initParams: IMqttParams): Promise<boolean> {
    try {
        if (mqttClient) {
            logger.info(`[initMqtt] mqtt already exist. close it`);
            mqttClient.disconnect();
        }
        const newMqttClient = new MQTT(initParams);
        const res = await newMqttClient.connect();
        logger.error(`[initMqtt] init mqtt result => ${res}`);
        if (res !== 1) {
            logger.error(`[initMqtt] init mqtt broker error`);
            newMqttClient.disconnect();
            return false;
        }

        mqttClient = newMqttClient;
        logger.info(`[initMqtt] current mqttClient is => ${mqttClient}`);
        return true;
    } catch (error: any) {
        logger.error(`[initMqtt] init mqtt error => ${error.message}`)
        return false;
    }
}


/**
 * @description 获取MQTT Client
 * @export
 * @returns {*}  {(Promise<MQTT | null>)}
 */
export async function getMQTTClient(): Promise<MQTT | null> {
    logger.info(`[getMQTTClient] getMQTTClient ${mqttClient}`)

    if (mqttClient) {
        logger.info(`[getMQTTClient] mqttClient exist => ${mqttClient}`)
        return mqttClient;
    }

    logger.info(`[getMQTTClient] mqttClient not exist!!! => ${mqttClient}`)
    const mqttSetting = await db.getDbValue('mqttSetting');
    if (mqttSetting) {
        const initRes = await initMqtt(mqttSetting);
        return initRes ? mqttClient : null
    }

    return null;
}