<template>
    <div ref="getAccessTokenRef">
        <a-modal
            :visible="getAccessTokenVisible && !isIframe"
            @cancel="cancelGetAccessTokenVisible"
            centered
            width="600px"
            :closable="false"
            :footer="null"
            :getContainer="() => getAccessTokenRef"
        >
            <div class="modal-body">
                <img src="@/assets/images/tip-icon.gif" />
                <div class="modal-context">
                    <div class="tip-title" style="text-align: center">{{ t('GET_ACCESS_TOKEN_TIP_TITLE') }}</div>
                    <div class="tip-context">
                        <div>Step 1:</div>
                        <div class="flex1">{{ t('GET_ACCESS_TOKEN_TIP1') }}</div>
                    </div>
                    <div class="tip-context" style="margin-top: 4px">
                        <div>Step 2:</div>
                        <div class="flex1">{{ t('GET_ACCESS_TOKEN_TIP2') }}</div>
                    </div>
                </div>
                <div class="modal-footer">
                    <a-button @click="cancelGetAccessTokenVisible">{{ t('CANCEL') }}</a-button>
                    <a-button @click="finish" type="primary">{{ t('FINISH') }}</a-button>
                </div>
            </div>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
import { getToken } from '@/api/apiService';
import { useI18n } from 'vue-i18n';
import { useEtcStore } from '@/stores/etc';
import { message } from 'ant-design-vue';
import { computed, ref, watch } from 'vue';

// 国际化
const { t } = useI18n();

const etcStore = useEtcStore();
const getAccessTokenRef = ref();
const props = defineProps({
    getAccessTokenVisible: {
        type: Boolean,
        default: false,
    },
});
const emits = defineEmits(['getTokenSuccess', 'hideModal', 'queryTimeUp']);
const getAccessTokenTimer = ref<any>();
const getAccessTokenNumber = ref<number>(0);
const isIframe = computed(() => {
    if (self.frameElement && self.frameElement.tagName == 'IFRAME') {
        return true;
    }
    if (window.frames.length != parent.frames.length) {
        return true;
    }
    if (self != top) {
        return true;
    }
    return false;
});
// const isIframe = ref(true);
const bodyHeight = computed(() => {
    if (etcStore.language === 'en-us') {
        return '572px';
    } else {
        return '545px';
    }
});
watch(
    () => props.getAccessTokenVisible,
    (newValue) => {
        if (newValue) {
            getIhostAccessToken();
        } else {
            if (getAccessTokenTimer.value > 0) {
                clearInterval(getAccessTokenTimer.value);
            }
        }
    }
);
watch(
    () => getAccessTokenNumber.value,
    (newValue) => {
        if (newValue >= 18) {
            console.log('over three minutes');
            clearInterval(getAccessTokenTimer.value);
            getAccessTokenNumber.value = 0;
            if (isIframe.value) {
                emits('queryTimeUp');
            }
        }
    }
);
const finish = async () => {
    try {
        const response = await getToken();
        if (response.error === 1701) {
            message.error(t('ERROR[1701]'));
            getAccessTokenNumber.value = 0;
            getIhostAccessToken();
            return;
        }
        if (response.error === 0) {
            emits('getTokenSuccess');
        }
    } catch (error) {
        message.error(t('ERROR[500]'));
    }
};

const getIhostAccessToken = async () => {
    getToken();
    if (getAccessTokenTimer.value > 0) {
        clearInterval(getAccessTokenTimer.value);
    }
    getAccessTokenTimer.value = setInterval(async () => {
        getAccessTokenNumber.value++;
        const res = await getToken();
        if (res.error === 0) {
            clearInterval(getAccessTokenTimer.value);
            if (isIframe.value) {
                emits('getTokenSuccess');
            }
        }
    }, 10000);
};

const cancelGetAccessTokenVisible = () => {
    if (getAccessTokenTimer.value > 0) {
        clearInterval(getAccessTokenTimer.value);
    }
    emits('hideModal');
};
</script>

<style scoped lang="scss">
.modal-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: v-bind(bodyHeight);
    .modal-context {
        font-size: 16px;
        font-weight: 600;
        margin: 14px 0 24px;
        // margin: 22px 0 40px;
        .tip-title {
            text-align: center;
            font-size: 18px;
            margin-bottom: 8px;
        }
        .tip-context {
            display: flex;
            :first-child {
                width: 55px;
            }
            .flex1 {
                flex: 1;
            }
        }
    }
    .modal-footer {
        display: flex;
        justify-content: center;
        gap: 58px;
    }
}

:deep(.ant-modal-content) {
    border-radius: 12px;
}
:deep(.ant-btn) {
    height: 40px;
    width: 120px;
}
</style>
