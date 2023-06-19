import mqtt, { IClientOptions } from 'mqtt';
import logger from '../../log';


const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL ?? 'mqtt://localhost';
const MQTT_BROKER_KEEPALIVE = process.env.env === 'dev' ? 5 : 60;

const MQTT_HOST_BASE_TOPIC = 'docker';
const MQTT_HOST_CLIENT_ID = 'tasmota-add-on';
const MQTT_HOST_USERNAME = "";
const MQTT_HOST_PASSWORD = "";

const MQTT_STORAGE_BASE_TOPIC = 'storage';

const CONNECT_OPTION: IClientOptions = {
    clientId: MQTT_HOST_CLIENT_ID,
    username: MQTT_HOST_USERNAME,
    password: MQTT_HOST_PASSWORD,
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
    isStorageAvailablity(topic = '') {
        let topicComopents = topic.split('/');
        return topicComopents[0] === MQTT_STORAGE_BASE_TOPIC
            && topicComopents[1] === 'system'
            && topicComopents[3] === 'availability';
    },

    isStorageInformation(topic = '') {
        let topicComopents = topic.split('/');
        return topicComopents[0] === MQTT_STORAGE_BASE_TOPIC
            && topicComopents[1] === 'device'
            && topicComopents[3] === 'information';
    },

    isStorageUpdatedState(topic = '') {
        let topicComopents = topic.split('/');
        return topicComopents[0] === MQTT_STORAGE_BASE_TOPIC
            && topicComopents[1] === 'device'
            && topicComopents[3] === 'updated'
            && topicComopents[4] === 'state';
    },

    isStorageFormatResult(topic = '') {
        let topicComopents = topic.split('/');
        return topicComopents[0] === MQTT_STORAGE_BASE_TOPIC
            && topicComopents[1] === 'device'
            && topicComopents[3] === 'updated'
            && topicComopents[4] === 'format';
    },

    isStorageDiscovered(topic = '') {
        let topicComopents = topic.split('/');
        return topicComopents[0] === MQTT_STORAGE_BASE_TOPIC
            && topicComopents[1] === 'system'
            && topicComopents[2] === 'discovered';
    },

    isStorageDeleted(topic = '') {
        let topicComopents = topic.split('/');
        return topicComopents[0] === MQTT_STORAGE_BASE_TOPIC
            && topicComopents[1] === 'device'
            && topicComopents[3] === 'deleted';
    },

    isSystemLogUpdate(topic = '') {
        let topicComopents = topic.split('/');
        return topicComopents[0] === MQTT_HOST_BASE_TOPIC
            && topicComopents[1] === 'system'
            && topicComopents[2] === 'log'
            && topicComopents[3] === 'update';
    },

    isBridgeAccesstoken(topic = '') {
        let topicComopents = topic.split('/');
        return topicComopents[0] === 'bridge'
            && topicComopents[1] === 'updated'
            && topicComopents[2] === 'access_token';
    },

    // bridge/updated/time_zone
    isBridgeTimezone(topic = "") {
        let topicComopents = topic.split('/');
        return topicComopents[0] === 'bridge'
            && topicComopents[1] === 'updated'
            && topicComopents[2] === 'time_zone';
    }
};


class MQTT {
    connectionTimer: NodeJS.Timer | null;
    publishedTopics: Set<string>;
    client = Client | null;




    constructor() {
        this.connectionTimer = null;
        this.publishedTopics = new Set();
        this.client = null;
        this.lastSeq = -1;
        this.cache = {};
    }

    async connect() {
        logger.info(`[mqtt] Connecting to MQTT server at ${MQTT_BROKER_URL}`);
        let hasInit = false;

        return new Promise((resolve, reject) => {
            this.client = mqtt.connect(MQTT_BROKER_URL, CONNECT_OPTION);
            // https://github.com/Koenkk/zigbee2mqtt/issues/9822
            this.client.stream.setMaxListeners(0);

            const onConnect = this.#onConnect.bind(this);
            this.client.on('connect', async () => {
                await onConnect();
                hasInit = true;
                resolve();
            });

            this.client.on('error', (err) => {
                logger.error(`[mqtt] MQTT error: ${err.message}`);

                if (hasInit === true) {
                    reject(err);
                }

            });
            this.client.on('message', this.onMessage.bind(this));
        });
    }

    disconnect() {
        return this.client.end(true);
    }

    isConnected() {
        return this.client && !this.client.reconnecting;
    }

    async #onConnect() {
        // Set timer at interval to check if connected to MQTT server.
        clearTimeout(this.connectionTimer);
        this.connectionTimer = setInterval(() => {
            if (this.client.reconnecting) {
                logger.error('[mqtt] Not connected to MQTT server!');
            }
        }, 10 * 1000);

        logger.info('[mqtt] Connected to MQTT server');
        await this.publishStateOnline();

        /**
         * 订阅storage的功能主题
         */
        this.subscribe(`storage/system/availability`);
        this.subscribe(`storage/system/discovered`);
        this.subscribe(`storage/device/#`);
        /**
         * 订阅bridge功能
         */
        this.subscribe(`bridge/updated/access_token`);
        this.subscribe(`bridge/updated/time_zone`);
        /**
         * 订阅日志功能
         */
        this.subscribe(`docker/system/log/update/#`);
    }

    /**
     * @param {string} topic 
     * @param {string} payload 
     * @param {mqtt.IPublishPacket} packet 
     * @returns 
     */
    onMessage(topic, payload, packet) {
        if (this.publishedTopics.has(topic)) return;
        logger.info(`onmessage <========== `, topic, payload.toString(), payload.length);
        const eventData = {
            topic,
            data: {},
            packet
        };

        try {
            eventData.data = payload.length && JSON.parse(payload);
        } catch (error) {
            logger.error(`onMessage parse payload error: ${topic} ${payload} ${error}`);
            return;
        }

        if (mqttTopicParser.isStorageAvailablity(topic)) this.eventBus.emitStorageAvailablity(eventData);
        else if (mqttTopicParser.isStorageInformation(topic)) this.eventBus.emitStorageInformation(eventData);
        else if (mqttTopicParser.isStorageUpdatedState(topic)) this.eventBus.emitStorageUpdatedState(eventData);
        else if (mqttTopicParser.isStorageFormatResult(topic)) this.eventBus.emitStorageFormatResult(eventData);
        else if (mqttTopicParser.isStorageDiscovered(topic)) this.eventBus.emitStorageDiscovered(eventData);
        else if (mqttTopicParser.isStorageDeleted(topic)) this.eventBus.emitStorageDeleted(eventData);
        else if (mqttTopicParser.isSystemLogUpdate(topic)) this.eventBus.emitSystemLogUpdate(eventData);
        else if (mqttTopicParser.isBridgeAccesstoken(topic)) {
            this.cache.tokenInfo = eventData?.data;
            this.eventBus.emitBridgeUpdatedAccesstoken(eventData);
        } else if (mqttTopicParser.isBridgeTimezone(topic)) {
            this.cache.timezoneInfo = eventData?.data;
            this.eventBus.emitSystemTimeZoneUpdate(eventData);
        }
    }

    async publishStateOnline() {
        await this.publish(
            `${MQTT_HOST_BASE_TOPIC}/system/availability`,
            JSON.stringify({ online: true }),
            { retain: true, qos: 2 }
        );
    }

    getSeq() {
        const curTs = Date.now();
        this.lastSeq = this.lastSeq === curTs ? curTs + 1 : curTs;
        return this.lastSeq;
    }

    subscribe(topic, opt) {
        opt = Object.assign({}, { qos: 2, rap: true }, opt);
        this.client.subscribe(topic, opt);
    }

    /**
     * 
     * @param {string} topic 
     * @param {string | object} payload 
     * @param {mqtt.IClientPublishOptions} options 
     * @returns 
     */
    async publish(topic, payload, options = {}) {
        const defaultOptions = {
            qos: 1,
            retain: false,
            properties: {
                userProperties: {
                    reqClientId: MQTT_HOST_CLIENT_ID,
                    reqSequence: this.getSeq()
                }
            }
        };
        if (!this.isConnected()) {
            logger.error(`Not connected to MQTT server!`);
            logger.error(`Cannot send message: topic: '${topic}', payload: '${payload}`);
            return;
        }

        this.publishedTopics.add(topic);

        const actualOptions = { ...defaultOptions, ...options };
        if (typeof payload === 'object') payload = JSON.stringify(payload);

        logger.info(`publish ==========> `, topic, payload);

        return new Promise((resolve, reject) => {
            this.client.publish(
                topic,
                payload,
                actualOptions,
                (error) => {
                    if (error) {
                        logger.error(`publish ${topic} error, message is "${error}", opt is ${JSON.stringify(actualOptions)}`);
                        reject();
                    } else {
                        resolve();
                    }
                });
        });
    }
}

module.exports = MQTT;