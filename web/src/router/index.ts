import { createRouter, createWebHashHistory } from 'vue-router';

const DeviceList = () => import('@/views/DeviceList.vue');
const MqttSettings = () => import('@/views/MqttSettings.vue');

const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'deviceList',
            component: DeviceList,
        },
        {
            path: '/mqttSettings',
            name: 'mqttSettings',
            component: MqttSettings,
        },
    ],
});

export default router;
