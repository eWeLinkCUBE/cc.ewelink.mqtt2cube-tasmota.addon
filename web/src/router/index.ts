import { createRouter, createWebHashHistory } from 'vue-router';
import ERouterName from '@/ts/enum/ERouterName';
import { getMqtt } from '@/api/apiService';

const DeviceList = () => import('@/views/DeviceList.vue');
const MqttSettings = () => import('@/views/MqttSettings.vue');
const UserHelper = () => import('@/views/UserHelper.vue');

const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: ERouterName.DEVICE_LIST,
            component: DeviceList,
        },
        {
            path: `/${ERouterName.MQTT_SETTINGS}`,
            name: ERouterName.MQTT_SETTINGS,
            component: MqttSettings,
        },
        {
            path: `/${ERouterName.USER_HELPER}`,
            name: ERouterName.USER_HELPER,
            component: UserHelper,
        },
        {
            path: '/:catchAll(.*)*',
            redirect: '/',
        },
    ],
});

router.beforeEach(async (to, from, next) => {
    // 设备列表页需先校验是否已配置过mqtt
    // 未配置过，需跳转到使用前提示页
    if (to.name === ERouterName.DEVICE_LIST) {
        const response = await getMqtt();
        // 没有配置过
        if (response.error === 1101) {
            next({ name: ERouterName.USER_HELPER });
        } else {
            next();
        }
    } else {
        next();
    }
});

export default router;
