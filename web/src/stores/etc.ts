import { defineStore } from 'pinia';
import i18n from '@/i18n';

interface IEtcStoreState {
    language: 'zh-cn' | 'en-us';
    getAccessTokenVisible: boolean;
    isSetMqtt: boolean;
    isCheckHelper: boolean;
}

export const useEtcStore = defineStore('user', {
    state(): IEtcStoreState {
        return {
            language: 'zh-cn',
            getAccessTokenVisible: false,
            isSetMqtt: false,
            isCheckHelper: false,
        };
    },
    actions: {
        languageChange(lang) {
            this.language = lang;
            i18n.global.locale = lang;
        },
        setGetAccessTokenVisible(state: boolean) {
            this.getAccessTokenVisible = state;
        },
        updateIsSetMqtt(isSet: boolean) {
            this.isSetMqtt = isSet;
        },
        updateIsCheckHelper(isCheck: boolean) {
            this.isCheckHelper = isCheck;
        },
    },
    persist: true,
});
