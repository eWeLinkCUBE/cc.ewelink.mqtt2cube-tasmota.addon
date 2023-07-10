<template>
    <div id="device-list-page">
        <div class="warning-banner" v-if="!deviceStore.isMqttConnected">
            <img :src="warningIcon" alt="" />
            <span>{{ t('DEVICE_LIST_DISCONNECT_TIP') }}</span>
        </div>
        <div class="header">
            <span class="title">{{ t('DEVICE_LIST_TITLE') }}</span>
            <div class="right">
                <span class="auto-sync-tip">{{ t('AUTO_SYNC_TIP') }}</span>
                <a-switch v-model:checked="autoSyncSwitch" :loading="autoSyncLoading" @click="toggleAutoSync" :disabled="!deviceStore.isMqttConnected"></a-switch>
                <!-- <img :class="!deviceStore.isMqttConnected ? 'icon sync-all-icon sync-all-icon-disabled' : 'icon sync-all-icon'" :src="syncAllIcon" alt="" @click="syncAllDevice" /> -->
                <div class="wrap" @click="goSettingsPage">
                    <img class="icon settings-icon" :src="settingsIcon" alt="" />
                    <img :src="warningIcon" alt="" v-if="!deviceStore.isMqttConnected" class="disconnect-warning-icon" />
                </div>
            </div>
        </div>
        <div class="body" :style="!deviceStore.deviceList.length ? { display: 'flex', flex: 1 } : {}">
            <div class="device-list-container" v-if="deviceStore.deviceList.length">
                <template v-for="device in deviceStore.deviceList" :key="device.id">
                    <div class="device-item">
                        <img
                            :src="
                                device.category === EDeviceCategory.UNSUPPORTED
                                    ? unsupportedIcon
                                    : getAssetsFile(`images/device/${device.category}_${device.online ? 'online' : 'offline'}_icon.png`)
                            "
                            alt=""
                            class="device-icon"
                        />
                        <div class="info">
                            <span class="name">{{ device.name }}</span>
                            <div class="status-container">
                                <div class="left">
                                    <span class="status" v-if="device.category !== EDeviceCategory.UNSUPPORTED">{{ device.online ? '' : t('DEVICE_OFFLINE') }}</span>
                                    <div class="unsupported" v-else>
                                        <img :src="warningIcon" alt="" class="warning-icon" />
                                        <span class="warning-tip">{{ t('DEVICE_LIST_UNSUPPORTED_TIP') }}</span>
                                    </div>
                                </div>
                                <div class="right" v-if="device.category !== EDeviceCategory.UNSUPPORTED">
                                    <img :src="loadingIcon" alt="" class="sync-loading-icon" v-if="device.syncing" />
                                    <span class="sync" @click="sync(device.id)" v-else-if="!device.synced">{{ t('SYNC') }}</span>
                                    <span class="unsync" @click="unsync(device.id)" v-else>{{ t('CANCELING_SYNC') }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </div>
            <div class="no-device" :style="!deviceStore.deviceList.length ? { flex: 1 } : {}" v-else>
                <img :src="noDataImg" alt="" />
                <span>{{ t('NO_DATA') }}</span>
            </div>
        </div>
        <div class="loading-mask" v-if="syncAllDeviceLoading">
            <img :src="maskLoadingIcon" alt="" />
            <span>{{ t('SYNCING_ALL_DEVICE_TIP') }}</span>
        </div>
        <GetAccessTokenModalVue
            v-model:getAccessTokenVisible="etcStore.getAccessTokenVisible"
            @getTokenSuccess="getTokenSuccessHandler"
            @hideModal="cancelGetTokenHandler"
            @queryTimeUp="queryTokenTimeUpHandler"
        ></GetAccessTokenModalVue>
    </div>
</template>

<script setup lang="ts">
import { getAssetsFile } from '@/utils/tools';
import { useI18n } from 'vue-i18n';
import { useEtcStore } from '@/stores/etc';
import { useDeviceStore } from '@/stores/device';
import { useSseStore } from '@/stores/sse';
import EDeviceCategory from '@/ts/enum/EDeviceCategory';
import { autoSync, getAutoSync, syncAll, syncSingle, unsyncSingle } from '@/api/apiService';
import { message } from 'ant-design-vue';
import GetAccessTokenModalVue from '../components/GetAccessTokenModal.vue';
import router from '@/router';
import ERouterName from '@/ts/enum/ERouterName';

// pinia
const etcStore = useEtcStore();
const deviceStore = useDeviceStore();
const sseStore = useSseStore();

// 图片资源
const settingsIcon = getAssetsFile('images/settings_icon.png');
const unsupportedIcon = getAssetsFile('images/device/unknown_icon.png');
const warningIcon = getAssetsFile('images/warning_icon.png');
const loadingIcon = getAssetsFile('images/loading_icon.png');
const noDataImg = getAssetsFile('images/no_data.png');
const maskLoadingIcon = getAssetsFile('images/mask_loading_icon.png');

// 国际化
const { t } = useI18n();

// 交互状态
const autoSyncSwitch = ref(false);
const autoSyncLoading = ref(true);
const syncAllDeviceLoading = ref(false);

// 数据
const syncType = ref<'all' | 'sync' | 'unsync' | 'auto' | ''>('');
const syncId = ref('');

// 方法/回调
// 开关新增设备自动同步
const toggleAutoSync = async (isOn: boolean) => {
    try {
        autoSyncLoading.value = true;
        syncType.value = 'auto';
        const response = await autoSync({ autoSync: isOn });
        if (response.error !== 0) {
            // 缺少token凭证
            if (response.error === 602) {
                etcStore.setGetAccessTokenVisible(true);
                return;
            }
            if (response.error === 603) {
                deviceStore.updateIsMqttConnected(false);
            } else {
                message.error(t('ERROR[500]'));
            }
            autoSyncSwitch.value = !isOn;
        }
        syncType.value = '';
        autoSyncLoading.value = false;
    } catch (error) {
        console.log('开关新增设备自动同步出错：', error);
        autoSyncLoading.value = false;
        autoSyncSwitch.value = !isOn;
        syncType.value = '';
        message.error(t('ERROR[500]'));
    }
};

// 获取设备自动同步开关状态
const getAutoSyncStatus = async () => {
    try {
        autoSyncLoading.value = true;
        const response = await getAutoSync();
        if (response.error !== 0) {
            console.log('获取设备自动同步开关状态错误：', response);
            if (response.error === 603) {
                deviceStore.updateIsMqttConnected(false);
            }
            autoSyncLoading.value = false;
            return;
        }
        autoSyncLoading.value = false;
        autoSyncSwitch.value = response.data.autoSync;
    } catch (error) {
        console.log('获取设备自动同步开关状态出错：', error);
        autoSyncLoading.value = false;
    }
};

// 同步所有设备
const syncAllDevice = async () => {
    if (!deviceStore.isMqttConnected) return;
    try {
        syncAllDeviceLoading.value = true;
        syncType.value = 'all';
        const response = await syncAll();
        if (response.error !== 0) {
            console.log('同步所有设备错误', response);
            // 缺少token凭证
            if (response.error === 602) {
                etcStore.setGetAccessTokenVisible(true);
                return;
            }
            syncAllDeviceLoading.value = false;
            // mqtt连接断开
            if (response.error === 603) {
                deviceStore.updateIsMqttConnected(false);
            }
            syncType.value = '';
            return message.error(t('SYNC_FAIL'));
        }
        message.success(t('DEVICE_SYNC_SUCCESS', { number: response.data.successList.length }));
        // 拉取最新设备列表
        await deviceStore.getDeviceList();
        syncAllDeviceLoading.value = false;
        syncType.value = '';
    } catch (error) {
        console.log('同步所有设备出错：', error);
        syncAllDeviceLoading.value = false;
        syncType.value = '';
        message.error(t('SYNC_FAIL'));
    }
};

// 获取凭证成功后回调，需重新进行上一次同步操作
const getTokenSuccessHandler = async () => {
    // 先隐藏弹框组件
    etcStore.setGetAccessTokenVisible(false);
    switch (syncType.value) {
        // 同步所有设备
        case 'all':
            await syncAllDevice();
            break;
        // 同步单个设备
        case 'sync':
            await sync(syncId.value);
            break;
        // 取消同步单个设备
        case 'unsync':
            await unsync(syncId.value);
            break;
        // 开关自动同步，不需要重新执行，只需恢复相关初始状态
        case 'auto':
            autoSyncSwitch.value = !autoSyncSwitch.value;
            autoSyncLoading.value = false;
            syncType.value = '';
            message.success(t('GET_TOKEN_SUCCESS'));
            break;
        default:
            console.log('syncType:', syncType.value);
            break;
    }
};

// 跳转配置mqtt
const goSettingsPage = () => {
    router.push({ name: ERouterName.MQTT_SETTINGS });
};

// 同步单个设备
const sync = async (id: string) => {
    try {
        // 未获取到token，需要取消上次同步设备的loading状态
        if (syncId.value) {
            setDeviceSyncLoading(syncId.value, false);
        }
        const device = deviceStore.deviceList.find((device) => device.id === id)!;
        device.syncing = true;
        const response = await syncSingle(id);
        if (response.error !== 0) {
            // 缺少token凭证
            if (response.error === 602) {
                syncId.value = id;
                syncType.value = 'sync';
                etcStore.setGetAccessTokenVisible(true);
                return;
            }
            device.syncing = false;
            if (response.error === 603) {
                deviceStore.updateIsMqttConnected(false);
            }
            syncId.value = '';
            syncType.value = '';
            return message.error(t('SYNC_FAIL'));
        }
        message.success(t('SYNC_SUCCESS'));
        // 拉取最新设备列表
        await deviceStore.getDeviceList();
        device.syncing = false;
        syncId.value = '';
        syncType.value = '';
    } catch (error) {
        console.log('同步单个设备出错：', error);
        syncId.value = '';
        syncType.value = '';
        message.error(t('SYNC_FAIL'));
    }
};

// 取消同步
const unsync = async (id: string) => {
    try {
        // 未获取到token，需要取消上次同步设备的loading状态
        if (syncId.value) {
            setDeviceSyncLoading(syncId.value, false);
        }
        const device = deviceStore.deviceList.find((device) => device.id === id)!;
        device.syncing = true;
        const response = await unsyncSingle(id);
        if (response.error !== 0) {
            // 缺少token凭证
            if (response.error === 602) {
                syncId.value = id;
                syncType.value = 'unsync';
                etcStore.setGetAccessTokenVisible(true);
                return;
            }
            device.syncing = false;
            if (response.error === 603) {
                deviceStore.updateIsMqttConnected(false);
            }
            syncId.value = '';
            syncType.value = '';
            return message.error(t('SYNC_FAIL'));
        }
        message.success(t('CANCEL_SYNC_SUCCESS'));
        // 拉取最新设备列表
        await deviceStore.getDeviceList();
        device.syncing = false;
        syncId.value = '';
        syncType.value = '';
    } catch (error) {
        console.log('取消同步单个设备出错：', error);
        syncId.value = '';
        message.error(t('SYNC_FAIL'));
    }
};

// 轮询 token 超过三分钟，取消所有同步相关的 loading状态
const queryTokenTimeUpHandler = () => {
    if (syncId.value) {
        setDeviceSyncLoading(syncId.value, false);
        syncId.value = '';
    }
    syncAllDeviceLoading.value = false;
    if (autoSyncLoading.value) {
        autoSyncSwitch.value = !autoSyncSwitch.value;
        autoSyncLoading.value = false;
    }
    syncType.value = '';
    message.error(t('GET_TOKEN_ERROR'));
    etcStore.setGetAccessTokenVisible(false);
};

// 外页弹窗点击取消回调
const cancelGetTokenHandler = () => {
    etcStore.setGetAccessTokenVisible(false);
    // 取消loading状态与上一次执行操作数据
    // 操作类型
    syncType.value && (syncType.value = '');
    // 同步/取消同步单个设备 loading
    if (syncId.value) {
        setDeviceSyncLoading(syncId.value, false);
        syncId.value = '';
    }
    // 开关自动同步新增设备 loading
    if (autoSyncLoading.value) {
        autoSyncLoading.value = false;
        autoSyncSwitch.value = !autoSyncSwitch.value;
    }
    // 同步所有设备 loading
    syncAllDeviceLoading.value = false;
};

// 设置设备卡片同步loading状态
const setDeviceSyncLoading = (id: string, show: boolean) => {
    const device = deviceStore.deviceList.find((item) => item.id === id);
    device && (device.syncing = show);
};

onMounted(async () => {
    // 初始化弹窗组件显示状态
    if (etcStore.getAccessTokenVisible) {
        etcStore.setGetAccessTokenVisible(false);
    }
    // 获取设备列表
    await deviceStore.getDeviceList();
    // 获取设备自动同步开关状态
    await getAutoSyncStatus();
    // 初始化sse
    await sseStore.startSse();
});
</script>

<style scoped lang="scss">
#device-list-page {
    display: flex;
    flex-direction: column;
    width: 100vw;
    height: 100vh;
    position: relative;
    .header {
        width: 100vw;
        height: 80px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        .title {
            font-size: 18px;
            color: #424242;
        }
        .right {
            display: flex;
            align-items: center;
            .auto-sync-tip {
                font-size: 14px;
                color: #424242;
                margin-right: 12px;
            }
            .icon {
                width: 28px;
                height: 28px;
                cursor: pointer;
                margin-right: 28px;
                transition: all ease-in-out 0.1s;
                // &:hover {
                //     margin-top: -4px;
                // }
                &:active {
                    opacity: 0.6;
                }
            }
            .sync-all-icon {
                margin-left: 40px;
            }
            .sync-all-icon-disabled {
                // &:hover {
                cursor: not-allowed;
                // }
            }
            .wrap {
                margin-left: 28px;
                position: relative;
                // &:hover {
                //     margin-top: -4px;
                // }
                .settings-icon {
                    margin-right: 0;
                    // &:hover {
                    //     margin-top: 0;
                    // }
                }
                .disconnect-warning-icon {
                    position: absolute;
                    bottom: -1px;
                    right: 1px;
                    width: 14px;
                    cursor: pointer;
                }
            }
        }
    }
    .body {
        overflow: hidden;
        .device-list-container {
            height: 100%;
            display: grid;
            grid-template-columns: repeat(auto-fit, 320px);
            grid-gap: 16px;
            overflow: hidden scroll;
            padding: 2px 8px 32px 16px;
            .device-item {
                padding: 16px 12px;
                border-radius: 10px;
                box-shadow: 0px 0px 6px -3px black;
                // min-width: 320px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                transition: all ease 0.2s;
                .device-icon {
                    width: 46px;
                    height: 46px;
                    margin-right: 16px;
                }
                .info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    .name {
                        font-size: 18px;
                        color: #424242;
                        font-weight: 500;
                        max-width: 250px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        display: -webkit-box;
                        -webkit-line-clamp: 1;
                        -webkit-box-orient: vertical;
                    }
                    .status-container {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        .left {
                            font-size: 14px;
                            line-height: 100%;
                            .status {
                                color: #a1a1a1;
                            }
                            .unsupported {
                                display: flex;
                                align-items: center;
                                .warning-icon {
                                    width: 18px;
                                    height: 18px;
                                    margin-right: 8px;
                                }
                                .warning-tip {
                                    color: #ff5c5b;
                                }
                            }
                        }
                        .right {
                            font-size: 14px;
                            color: #1890ff;
                            line-height: 100%;
                            display: flex;
                            align-items: center;
                            .sync-loading-icon {
                                width: 14px;
                                height: 14px;
                                animation: rotate 2s linear infinite;
                            }
                            @keyframes rotate {
                                0% {
                                    -webkit-transform: rotate(0deg);
                                }
                                100% {
                                    -webkit-transform: rotate(360deg);
                                }
                            }
                            span {
                                cursor: pointer;
                            }
                        }
                    }
                }
                .loading-icon {
                    width: 16px;
                    height: 16px;
                    margin-bottom: 6px;
                    animation: rotate 2s linear infinite;
                }
            }
            // 滚动条和滑块
            &::-webkit-scrollbar,
            &::-webkit-scrollbar-thumb {
                width: 8px;
                height: 8px;
                border-radius: 10px;
            }
            // 滑块背景色
            &::-webkit-scrollbar-thumb {
                background: #d8d8d8;
                &:hover {
                    background: #bcbcbc;
                }
            }
            // 其余相关样式设置成跟滑块一个背景色
            ::-webkit-scrollbar,
            ::-webkit-scrollbar-corner,
            ::-webkit-resizer,
            ::-webkit-scrollbar-track,
            ::-webkit-scrollbar-track-piece {
                background: transparent;
            }
        }
        @media screen and (max-width: 3040px) {
            .device-list-container {
                grid-template-columns: repeat(8, 1fr);
            }
        }
        @media screen and (max-width: 2704px) {
            .device-list-container {
                grid-template-columns: repeat(7, 1fr);
            }
        }
        @media screen and (max-width: 2368px) {
            .device-list-container {
                grid-template-columns: repeat(6, 1fr);
            }
        }
        @media screen and (max-width: 2032px) {
            .device-list-container {
                grid-template-columns: repeat(5, 1fr);
            }
        }
        @media screen and (max-width: 1696px) {
            .device-list-container {
                grid-template-columns: repeat(4, 1fr);
            }
        }
        @media screen and (max-width: 1360px) {
            .device-list-container {
                grid-template-columns: repeat(3, 1fr);
            }
        }
        @media screen and (max-width: 1024px) {
            .device-list-container {
                grid-template-columns: repeat(2, 1fr);
            }
        }
        @media screen and (max-width: 688px) {
            .device-list-container {
                grid-template-columns: repeat(2, 1fr);
            }
        }
        @media screen and (max-width: 540px) {
            .device-list-container {
                grid-template-columns: repeat(1, 1fr);
                .device-item {
                    min-width: 320px;
                }
            }
        }
        .no-device {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            img {
                width: 365px;
                margin-bottom: 40px;
            }
            span {
                color: #424242;
                font-size: 20px;
            }
        }
    }
    .loading-mask {
        width: 100vw;
        height: 100vh;
        position: absolute;
        z-index: 999;
        background-color: rgba(34, 34, 34, 0.6);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        img {
            width: 60px;
            height: 60px;
            margin-bottom: 6px;
            animation: rotate 2s linear infinite;
        }
        span {
            font-size: 16px;
            color: white;
        }
    }
    .warning-banner {
        width: 100vw;
        height: 26px;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: rgba(255, 92, 91, 0.2);
        img {
            width: 18px;
            height: 18px;
            margin-right: 8px;
        }
        span {
            font-size: 14px;
            color: #ff5c5b;
        }
    }
    &:deep(.ant-switch) {
        background-color: #e2e2e2;
        .ant-switch-handle {
            &::before {
                background-color: #bbbbbb;
            }
        }
        &:focus {
            box-shadow: unset;
        }
        .ant-click-animating-node {
            border: 0 none;
            opacity: 0;
            animation: none 0 ease 0 1 normal;
        }
        .ant-switch-loading-icon {
            color: white;
        }
    }
    &:deep(.ant-switch-checked) {
        background-color: #c1deff;
        .ant-switch-handle {
            &::before {
                background-color: #0177fd;
            }
        }
        .ant-switch-loading-icon {
            color: white;
        }
    }
}
</style>
