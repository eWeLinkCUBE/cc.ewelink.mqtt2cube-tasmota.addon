import { defineStore } from 'pinia';
import { SSE_URL } from '@/config';
import { useDeviceStore } from '@/stores/device';
let source: null | EventSource = null;

interface ISseState {
    sseIsConnect: boolean;
}

export const useSseStore = defineStore('sse', {
    state: (): ISseState => {
        return {
            sseIsConnect: false,
        };
    },
    actions: {
        setSseIsConnect(state: boolean) {
            this.sseIsConnect = state;
        },

        async startSse() {
            console.log('start SSE');
            if (source) source.close();
            const timestamp = new Date().getTime();
            source = new EventSource(`${SSE_URL}?id=${timestamp}`);
            source.addEventListener('open', () => {
                this.sseIsConnect = true;
            });

            /** 新增设备推送 */
            source.addEventListener('new_device_report', async (event: any) => {
                console.log('new_device_report------------->', event.data);
                await useDeviceStore().getDeviceList();
            });

            /** 设备取消同步 */
            source.addEventListener('un_sync_report', async (event: any) => {
                console.log('un_sync_report------------->', event.data);
                await useDeviceStore().getDeviceList();
            });

            /** 设备名称更改 */
            source.addEventListener('device_name_changed_report', async (event: any) => {
                console.log('device_name_changed_report------------->', event.data);
                await useDeviceStore().getDeviceList();
            });

            /** 设备上下线状态变更 */
            source.addEventListener('device_online_status_report', async (event: any) => {
                console.log('device_online_status_report------------->', event.data);
                await useDeviceStore().getDeviceList();
            });

            /** 设备成功同步 */
            source.addEventListener('sync_success_report', async (event: any) => {
                console.log('sync_success_report------------->', event.data);
                await useDeviceStore().getDeviceList();
            });

            /** mqtt 连接成功 */
            source.addEventListener('mqtt_connected_report', async (event: any) => {
                console.log('mqtt_connected_report------------->', event.data);
                await useDeviceStore().updateIsMqttConnected(true);
            });

            /** mqtt 断开连接 */
            source.addEventListener('mqtt_disconnect_report', async (event: any) => {
                console.log('mqtt_disconnect_report------------->', event.data);
                await useDeviceStore().updateIsMqttConnected(false);
            });



            /** SSE失败 */
            source.addEventListener('error', (event: any) => {
                // console.log('SSE connect error, reboot');
                setTimeout(() => {
                    this.startSse();
                }, 5000);
            });
        },
    },
    persist: true,
});
