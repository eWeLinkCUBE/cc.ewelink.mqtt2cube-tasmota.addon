import express from 'express';
import EApiPath from '../ts/enum/EApiPath';
import { checkSchema } from 'express-validator';
import validate from '../middleware/validate';

import syncAllDevices from '../services/syncAllDevices';
import syncOneDevice from '../services/syncOneDevice';
import getMQTTBroker from '../services/getMQTTBroker';
import setMQTTBroker from '../services/setMQTTBroker';
import unSyncOneDevice from '../services/unSyncOneDevice';
import getDeviceList from '../services/getDeviceList';
import getAutoSyncStatus from '../services/getAutoSyncStatus';
import changeAutoSyncStatus from '../services/changeAutoSyncStatus';
import getIHostToken from '../services/getIHostToken';

import unsyncOneDeviceSchema from '../schema/unsyncOneDevice';
import getGatewayTokenSchema from '../schema/getGatewayToken';
import syncOneDeviceSchema from '../schema/syncOneDevice';

// 开放接口
import openControlDevice from '../services/openControlDevice';

// SSE 接口
import sse from '../services/sse';


const router = express.Router();

router.get(EApiPath.GET_MQTT_BROKER, checkSchema({}), getMQTTBroker);
router.post(EApiPath.SET_MQTT_BROKER, checkSchema({}), setMQTTBroker);
router.get(EApiPath.GET_DEVICE_LIST, checkSchema({}), validate, getDeviceList);
// 暂不支持
// router.put(EApiPath.SYNC_ALL_DEVICES, checkSchema({}), syncAllDevices);
router.put(EApiPath.SYNC_ONE_DEVICE, checkSchema({}), syncOneDevice);
router.put(EApiPath.UN_SYNC_ONE_DEVICE, checkSchema({}), unSyncOneDevice);
router.get(EApiPath.GET_AUTO_SYNC_STATUS, checkSchema({}), getAutoSyncStatus);
router.put(EApiPath.CHANGE_AUTO_SYNC_STATUS, checkSchema({}), changeAutoSyncStatus);
router.get(EApiPath.GET_IHOST_TOKEN, checkSchema({}), getIHostToken);

// 开放接口路由
router.post(EApiPath.OPEN_CONTROL_DEVICE, checkSchema({}), validate, openControlDevice);

// SSE 接口路由
router.get(EApiPath.SSE, checkSchema({}), sse);

export default router;
