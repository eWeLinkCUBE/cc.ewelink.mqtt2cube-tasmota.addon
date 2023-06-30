import { createRouter, createWebHashHistory } from 'vue-router';
import { useEtcStore } from '@/stores/etc';
import ERouterName from '@/ts/enum/ERouterName';

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

router.beforeEach((to, from, next) => {
    // 设备列表页需先校验本地缓存状态 是否已配置过mqtt
    // 未配置过，需跳转到使用前提示页
    if (to.name === ERouterName.DEVICE_LIST && !useEtcStore().isSetMqtt) {
        next({ name: ERouterName.USER_HELPER });
    } else {
        next();
    }
});

export default router;
