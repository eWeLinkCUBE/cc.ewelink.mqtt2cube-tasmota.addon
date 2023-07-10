<template>
    <div id="user-helper-page">
        <div class="setting-tip-container">
            <div class="body">
                <div class="main-title">{{ t('SETTINGS_TIP_MODAL.MAIN_TITLE') }}</div>
                <div class="tip-block prepare-work-block">
                    <div class="tip-title prepare-work-title">{{ t('SETTINGS_TIP_MODAL.PREPARE_WORK.TITLE') }}</div>
                    <ul style="list-style-type: decimal; padding-inline-start: 20px; margin-bottom: 0">
                        <li class="tip-content prepare-work-content">{{ t('SETTINGS_TIP_MODAL.PREPARE_WORK.STEP1') }}</li>
                        <li class="tip-content prepare-work-content">{{ t('SETTINGS_TIP_MODAL.PREPARE_WORK.STEP2') }}</li>
                        <li class="tip-content prepare-work-content">{{ t('SETTINGS_TIP_MODAL.PREPARE_WORK.STEP3') }}</li>
                        <li class="tip-content prepare-work-content">
                            {{ t('SETTINGS_TIP_MODAL.PREPARE_WORK.STEP4') }}<u class="doc-link" @click="goDoc">{{ t('SETTINGS_TIP_MODAL.PREPARE_WORK.DOC_LINK') }}</u>
                        </li>
                    </ul>
                </div>
                <div class="tip-block supported-device-block">
                    <div class="tip-title supported-device-title">{{ t('SETTINGS_TIP_MODAL.SUPPORTED_DEVICE.TITLE') }}</div>
                    <span class="tip-content supported-device-content">{{ t('SETTINGS_TIP_MODAL.SUPPORTED_DEVICE.CONTENT') }}</span>
                </div>
                <div class="tip-content footer-tip">{{ t('SETTINGS_TIP_MODAL.FOOTER_TIP') }}</div>
            </div>
            <div class="footer">
                <a-button class="confirm-btn" @click="goMqttSettings">{{ t('SETTINGS_TIP_MODAL.CONFIRM') }}</a-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import router from '@/router';
import ERouterName from '@/ts/enum/ERouterName';
import { useEtcStore } from '@/stores/etc';

// pinia
const etcStore = useEtcStore();

// 国际化
const { t } = useI18n();

// 跳转参考文档
const goDoc = () => {
    window.open('https://tasmota.github.io/docs/Commands/#setoptions');
};

// 跳转 mqtt 配置页
const goMqttSettings = () => {
    router.push({ name: ERouterName.MQTT_SETTINGS });
};
</script>D

<style scoped lang="scss">
#user-helper-page {
    .setting-tip-container {
        width: 100vw;
        height: 100vh;
        background-color: white;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        .body {
            display: flex;
            flex-direction: column;
            border-radius: 8px;
            color: #424242;
            font-weight: 400;
            background-color: white;
            padding: 20px 16px;
            .main-title {
                font-size: 16px;
                font-weight: 500;
                margin-bottom: 16px;
            }
            .tip-block {
                width: 100%;
                font-size: 14px;
                margin-bottom: 12px;
                .tip-title {
                    margin-bottom: 4px;
                    font-size: 16px;
                }
                .tip-content {
                    color: #999999;
                    line-height: 25px;
                }
            }
            .prepare-work-block {
                .doc-link {
                    color: #1890ff;
                    cursor: pointer;
                }
            }
            .supported-device-block {
                .supported-device-content {
                    display: inline-block;
                    text-indent: 4px;
                }
            }
            .footer-tip {
                margin-top: -4px;
                margin-bottom: 24px;
                color: #999999;
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
        @media screen and (max-height: 410px) {
            .body {
                flex: 1;
                overflow: auto scroll;
            }
        }
        .footer {
            width: 100%;
            height: 80px;
            padding-top: 20px;
            display: flex;
            justify-content: center;
            .confirm-btn {
                width: 200px;
                height: 36px;
                border-radius: 4px;
                font-size: 14px;
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
        }
    }
}
</style>
