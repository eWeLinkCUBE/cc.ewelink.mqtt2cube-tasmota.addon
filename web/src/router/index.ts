import { createRouter, createWebHashHistory } from 'vue-router';
import { useEtcStore } from '@/stores/etc';
import ERouterName from '@/ts/enum/ERouterName';

const DeviceList = () => import('@/views/DeviceList.vue');
const MqttSettings = () => import('@/views/MqttSettings.vue');

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
    ],
});

router.beforeEach((to, from, next) => {
    // 设备列表页需先校验本地缓存状态 是否已配置过mqtt
    // 未配置过，需跳转到mqtt配置页
    if (to.name === ERouterName.DEVICE_LIST && !useEtcStore().isSetMqtt) {
        next({ name: ERouterName.MQTT_SETTINGS });
    } else {
        next();
    }
});

export default router;
