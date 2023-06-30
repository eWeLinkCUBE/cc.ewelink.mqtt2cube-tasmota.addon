<template>
    <div id="mqtt-settings-page">
        <div class="header">
            <span class="title">{{ t('SETTINGS_HEADER_TITLE') }}</span>
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
        console.log('获取MQTT Broker配置结果：', response);
        if (response.error !== 0) {
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
            message.error(t('ERROR[500]'));
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
    console.log('options.value', options.value);
    for (let option of options.value) {
        if ((option.key === 'host' || option.key === 'port') && !option.value.trim()) {
            return message.warning(t('SETTINGS_SAVE_VALIDATE_LACK'));
        }
        if (option.key === 'port' && !/^\d+$/.test(option.value.trim())) {
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
                params[option.key] = encryptAES(option.value.trim(), APP_SECRET);
                break;
            default:
                params[option.key] = option.value.trim();
                break;
        }
        params[option.key] = option.key === 'pwd' ? encryptAES(option.value.trim(), APP_SECRET) : option.value.trim();
    }
    console.log('配置数据：', params);
    const isSuccess = await setMqttSettings(params);
    if (isSuccess) {
        !etcStore.isSetMqtt && etcStore.updateIsSetMqtt(true);
        router.push({ name: ERouterName.DEVICE_LIST });
    }
};

onMounted(async () => {
    // 校验本地缓存状态是否已配置过mqtt且已确认使用前提示，若没有则跳转使用前提示页
    if (!etcStore.isSetMqtt && !etcStore.isCheckHelper) {
        router.push({ name: ERouterName.USER_HELPER });
        return;
    }
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
    .header {
        width: 100vw;
        height: 80px;
        display: flex;
        align-items: center;
        padding: 16px;
        .title {
            font-size: 18px;
            color: #424242;
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
}
</style>
