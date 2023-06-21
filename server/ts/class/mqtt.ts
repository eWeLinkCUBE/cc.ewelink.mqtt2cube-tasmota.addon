import mqtt, { IClientOptions, IPublishPacket, IClientSubscribeOptions } from 'mqtt';
import logger from '../../log';
import { IMqttParams } from '../interface/IMqtt';
import db from '../../utils/db';



const MQTT_BROKER_KEEPALIVE = process.env.env === 'dev' ? 5 : 60;

const MQTT_HOST_BASE_TOPIC = 'docker';
const MQTT_HOST_CLIENT_ID = 'tasmota-add-on';

const MQTT_STORAGE_BASE_TOPIC = 'storage';

const connectOption: IClientOptions = {
    clientId: MQTT_HOST_CLIENT_ID,
    keepalive: MQTT_BROKER_KEEPALIVE,
    clean: true,
    protocolId: 'MQTT',
    protocolVersion: 5,
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000,
    properties: {
        sessionExpiryInterval: 0
    },
    // will: {
    //     topic: `${MQTT_HOST_BASE_TOPIC}/system/availability`,
    //     retain: true,
    //     payload: JSON.stringify({
    //         online: false,
    //         reason: "KeepAlive timeout"
    //     }),
    //     qos: 2,
    //     properties: {
    //         contentType: "application/json",
    //         payloadFormatIndicator: true,
    //         userProperties: {
    //             reqClientId: MQTT_HOST_CLIENT_ID, // 标明本消息的原始请求方（AI Bridge 网关内部某功能模块）
    //             reqSequence: Date.now()
    //         },
    //     }
    // }
};

const mqttTopicParser = {
    isDiscoveryMsg(topic = '') {
        let topicComponents = topic.split('/');
        return topicComponents[0] === 'tasmota'
            && topicComponents[1] === 'discovery'
            && topicComponents[3] === 'config';
    },

    isStorageUpdatedState(topic = '') {
        let topicComponents = topic.split('/');
        return topicComponents[0] === MQTT_STORAGE_BASE_TOPIC
            && topicComponents[1] === 'device'
            && topicComponents[3] === 'updated'
            && topicComponents[4] === 'state';
    },

    isStorageFormatResult(topic = '') {
        let topicComponents = topic.split('/');
        return topicComponents[0] === MQTT_STORAGE_BASE_TOPIC
            && topicComponents[1] === 'device'
            && topicComponents[3] === 'updated'
            && topicComponents[4] === 'format';
    },

    isStorageDiscovered(topic = '') {
        let topicComponents = topic.split('/');
        return topicComponents[0] === MQTT_STORAGE_BASE_TOPIC
            && topicComponents[1] === 'system'
            && topicComponents[2] === 'discovered';
    },

    isStorageDeleted(topic = '') {
        let topicComponents = topic.split('/');
        return topicComponents[0] === MQTT_STORAGE_BASE_TOPIC
            && topicComponents[1] === 'device'
            && topicComponents[3] === 'deleted';
    },

    isSystemLogUpdate(topic = '') {
        let topicComponents = topic.split('/');
        return topicComponents[0] === MQTT_HOST_BASE_TOPIC
            && topicComponents[1] === 'system'
            && topicComponents[2] === 'log'
            && topicComponents[3] === 'update';
    },

    isBridgeAccesstoken(topic = '') {
        let topicComponents = topic.split('/');
        return topicComponents[0] === 'bridge'
            && topicComponents[1] === 'updated'
            && topicComponents[2] === 'access_token';
    },

    // bridge/updated/time_zone
    isBridgeTimezone(topic = "") {
        let topicComponents = topic.split('/');
        return topicComponents[0] === 'bridge'
            && topicComponents[1] === 'updated'
            && topicComponents[2] === 'time_zone';
    }
};


/**
 * @description MQTT初始化及管理方法
 * @class MQTT
 */
class MQTT {
    initParams: IMqttParams;
    connectionTimer: NodeJS.Timer | null;
    publishedTopics: Set<string>;
    client: mqtt.MqttClient | null;
    cache: any;

    constructor(initParams: IMqttParams) {
        this.initParams = initParams;
        this.connectionTimer = null;
        this.publishedTopics = new Set();
        this.client = null;
        this.cache = {};
    }

    async connect() {
        const { username = "", pwd = "", host, port } = this.initParams
        const mqttUrl = `mqtt://${host}:${port}`;
        logger.info(`[mqtt] Connecting to MQTT server at ${mqttUrl}`);
        let hasInit = false;

        return new Promise((resolve, reject) => {
            if (username && pwd) {
                connectOption.username = username;
                connectOption.password = pwd;
            }
            logger.info(`[mqtt] connect option => ${JSON.stringify(connectOption)}`)
            this.client = mqtt.connect(mqttUrl, connectOption);
            this.client.setMaxListeners(0);

            const onConnect = this.#onConnect.bind(this);
            this.client.on('connect', async () => {
                await onConnect();
                hasInit = true;
                resolve(1);
            });

            this.client.on('error', (err) => {
                if (hasInit === true) {
                    reject(err);
                }

            });
            this.client.on('message', this.onMessage.bind(this));
        });
    }

    disconnect() {
        return this.client!.end(true);
    }

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
        // await this.publishStateOnline();

        // 订阅
        this.subscribe(`tasmota/discovery/#`);
        // this.subscribe(`storage/system/discovered`);
        // this.subscribe(`storage/device/#`);
        /**
         * 订阅bridge功能
         */
        // this.subscribe(`bridge/updated/access_token`);
        // this.subscribe(`bridge/updated/time_zone`);
        /**
         * 订阅日志功能
         */
        // this.subscribe(`docker/system/log/update/#`);
    }

    /**
     * @param {string} topic 
     * @param {string} payload 
     * @param {mqtt.IPublishPacket} packet 
     * @returns 
     */
    onMessage(topic: string, payload: Buffer, packet: IPublishPacket) {
        if (this.publishedTopics.has(topic)) {
            logger.error("[mqtt] receive same topic as I send it => ", topic, this.publishedTopics);
            return;
        };
        const truePayload = payload.toString();
        logger.info(`[mqtt] onMessage params`, topic, truePayload, payload.length);
        const eventData = {
            topic,
            data: {},
            packet
        };

        try {
            eventData.data = payload.length && JSON.parse(truePayload);
            logger.info(`[mqtt] onMessage params`, JSON.stringify(eventData));
        } catch (error) {
            logger.error(`[mqtt] onMessage parse error => ${error}`)
            return;
        }

        if (mqttTopicParser.isDiscoveryMsg(topic)) {

        }


        // if (mqttTopicParser.isStorageAvailablity(topic)) this.eventBus.emitStorageAvailablity(eventData);
        // else if (mqttTopicParser.isStorageInformation(topic)) this.eventBus.emitStorageInformation(eventData);
        // else if (mqttTopicParser.isStorageUpdatedState(topic)) this.eventBus.emitStorageUpdatedState(eventData);
        // else if (mqttTopicParser.isStorageFormatResult(topic)) this.eventBus.emitStorageFormatResult(eventData);
        // else if (mqttTopicParser.isStorageDiscovered(topic)) this.eventBus.emitStorageDiscovered(eventData);
        // else if (mqttTopicParser.isStorageDeleted(topic)) this.eventBus.emitStorageDeleted(eventData);
        // else if (mqttTopicParser.isSystemLogUpdate(topic)) this.eventBus.emitSystemLogUpdate(eventData);
        // else if (mqttTopicParser.isBridgeAccesstoken(topic)) {
        //     this.cache.tokenInfo = eventData?.data;
        //     this.eventBus.emitBridgeUpdatedAccesstoken(eventData);
        // } else if (mqttTopicParser.isBridgeTimezone(topic)) {
        //     this.cache.timezoneInfo = eventData?.data;
        //     this.eventBus.emitSystemTimeZoneUpdate(eventData);
        // }
    }

    // async publishStateOnline() {
    //     await this.publish(
    //         `${MQTT_HOST_BASE_TOPIC}/system/availability`,
    //         JSON.stringify({ online: true }),
    //         { retain: true, qos: 2 }
    //     );
    // }

    subscribe(topic: string, opt?: IClientSubscribeOptions) {
        logger.info(`[mqtt] subscribe topic ${topic} ${opt ? 'with option' + opt : ''}`)
        opt = Object.assign({}, { qos: 2, rap: true }, opt);
        this.client!.subscribe(topic, opt);
    }

    /**
     * 
     * @param {string} topic 
     * @param {string | object} payload 
     * @param {mqtt.IClientPublishOptions} options 
     * @returns 
     */
    async publish(topic: string, payload: Buffer, options = {}) {
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
export async function initMqtt(initParams: IMqttParams) {
    try {
        if (mqttClient) {
            logger.info(`[initMqtt] mqtt already exist. close it`);
            mqttClient.disconnect();
        }
        const newMqttClient = new MQTT(initParams);
        const res = await newMqttClient.connect();
        if (res !== 1) {
            return false;
        }

        mqttClient = newMqttClient;
        return true;
    } catch (error: any) {
        logger.error(`[initMqtt] init mqtt error => ${error.message}`)
        return false;
    }
}

export default mqttClient;