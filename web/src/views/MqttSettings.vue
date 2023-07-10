<template>
    <div id="mqtt-settings-page">
        <div class="header">
            <span class="title">{{ t('SETTINGS_HEADER_TITLE') }}</span>
            <img :src="deviceListIcon" alt="" class="go-device-list-icon" @click="goHome" v-if="showIcon" />
        </div>
        <div class="body">
            <span class="title">{{ t('SETTINGS_BODY_TITLE') }}</span>
            <span class="desc">{{ t('SETTINGS_DESCRIPTION') }}</span>
            <div class="form-item" v-for="item in options" :key="item.key">
                <div class="form-label"><span style="color: #ff5c5b; margin-right: 3px" v-if="item.required">*</span>{{ item.label }}</div>
                <a-input-password @keydown.enter="save" class="form-input" v-if="item.key === 'pwd'" v-model:value="item.value" :placeholder="item.placeholder"></a-input-password>
                <a-input @keydown.enter="save" v-else class="form-input" v-model:value="item.value" :placeholder="item.placeholder"></a-input>
            </div>
        </div>
        <div class="footer">
            <a-button :disabled="saveDisabled" :loading="saveLoading" class="save-btn" @click="save">{{ t('SAVE') }}</a-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { getMqtt, setMqtt, type IBroker } from '@/api/apiService';
import { message } from 'ant-design-vue';
import { decryptAES, encryptAES } from '@/utils/tools';
import { APP_SECRET } from '@/config';
import router from '@/router';
import { useEtcStore } from '@/stores/etc';
import ERouterName from '@/ts/enum/ERouterName';
import { useDeviceStore } from '@/stores/device';
import deviceListIcon from '@/assets/images/device_list_icon.png';

interface IOption {
    label: string;
    key: string;
    value: string;
    placeholder: string;
    required: boolean;
}

// pinia
const etcStore = useEtcStore();

// 国际化
const { t } = useI18n();

// 状态
const saveDisabled = computed(() => {
    return options.value.some((item: IOption) => {
        return item.required && !item.value.trim();
    });
});
const saveLoading = ref(false);
const showIcon = ref(true);

// 数据
const options = ref<IOption[]>([
    {
        label: t('SETTINGS_FORM.HOST'),
        key: 'host',
        value: '',
        placeholder: t('SETTINGS_PLACEHOLDER.HOST'),
        required: true,
    },
    {
        label: t('SETTINGS_FORM.PORT'),
        key: 'port',
        value: '',
        placeholder: t('SETTINGS_PLACEHOLDER.PORT'),
        required: true,
    },
    {
        label: t('SETTINGS_FORM.USERNAME'),
        key: 'username',
        value: '',
        placeholder: t('SETTINGS_PLACEHOLDER.USERNAME'),
        required: false,
    },
    {
        label: t('SETTINGS_FORM.PASSWORD'),
        key: 'pwd',
        value: '',
        placeholder: t('SETTINGS_PLACEHOLDER.PASSWORD'),
        required: false,
    },
]);

// 方法/回调
// 获取MQTT Broker配置
const getMqttSettings = async () => {
    try {
        const response = await getMqtt();
        if (response.error !== 0) {
            if (response.error === 1101) {
                showIcon.value = false;
            }
            return;
        }
        for (let option of options.value) {
            option.value = option.key === 'pwd' ? decryptAES(response.data[option.key], APP_SECRET) : response.data[option.key];
        }
    } catch (error) {
        console.log('获取MQTT Broker配置出错：', error);
    }
};

// 配置MQTT Broker
const setMqttSettings = async (params: IBroker) => {
    try {
        saveLoading.value = true;
        const response = await setMqtt(params);
        if (response.error !== 0) {
            response.error === 1001 ? message.error(t('ERROR[1001]')) : message.error(t('ERROR[500]'));
            saveLoading.value = false;
            return false;
        }
        message.success(t('SETTINGS_SAVE_SUCCESS'));
        saveLoading.value = false;
        return true;
    } catch (error) {
        console.log('配置 MQTT Broker 出错：', error);
        message.error(t('ERROR[500]'));
        saveLoading.value = false;
        return false;
    }
};

// 保存
const save = async () => {
    const params: IBroker = {} as IBroker;
    for (let option of options.value) {
        if ((option.key === 'host' || option.key === 'port') && !option.value.trim()) {
            return message.warning(t('SETTINGS_SAVE_VALIDATE_LACK'));
        }
        if (option.key === 'port' && !/^\d+$/.test(option.value.trim().split(/\s+/).join(''))) {
            return message.warning(t('SETTINGS_SAVE_VALIDATE_PORT_NUMBER'));
        }
        switch (option.key) {
            case 'host':
                params[option.key] = option.value.trim().split(/\s+/).join('');
                break;
            case 'port':
                params[option.key] = option.value.trim().split(/\s+/).join('');
                break;
            case 'pwd':
                params[option.key] = option.value.trim() ? encryptAES(option.value.trim(), APP_SECRET) : '';
                break;
            default:
                params[option.key] = option.value.trim().split(/\s+/).join('')
                break;
        }
    }
    const isSuccess = await setMqttSettings(params);
    if (isSuccess) {
        useDeviceStore().updateIsMqttConnected(true);
        router.push({ name: ERouterName.DEVICE_LIST });
    }
};

// 回到设备列表页
const goHome = () => {
    router.push({ name: ERouterName.DEVICE_LIST });
};

onMounted(async () => {
    await getMqttSettings();
});
</script>

<style scoped lang="scss">
#mqtt-settings-page {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden scroll;
    .header {
        width: 100vw;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        .title {
            font-size: 18px;
            color: #424242;
        }
        .go-device-list-icon {
            width: 24px;
            height: 24px;
            cursor: pointer;
            margin-right: 20px;
        }
    }
    .body {
        display: flex;
        flex-direction: column;
        color: #424242;
        align-items: center;
        padding: 20px 160px;
        .title {
            font-size: 20px;
            margin-bottom: 28px;
        }
        .desc {
            font-size: 16px;
            margin-bottom: 40px;
        }
        .form-item {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            .form-label {
                width: 130px;
                text-align: right;
                font-size: 16px;
                margin-right: 30px;
            }
            .form-input {
                width: 360px;
            }
        }
    }
    .footer {
        width: 100%;
        display: flex;
        justify-content: center;
        margin-top: 60px;
        padding-bottom: 40px;
        .save-btn {
            width: 200px;
            height: 40px;
            border-radius: 8px;
            &,
            &:active,
            &:focus {
                background-color: #1890ff;
                color: white;
            }
            &:hover {
                background-color: #409eff;
                color: white;
            }
        }
        .ant-btn[disabled] {
            &,
            &:active,
            &:focus {
                background-color: #999999;
                color: white;
            }
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
</style>
