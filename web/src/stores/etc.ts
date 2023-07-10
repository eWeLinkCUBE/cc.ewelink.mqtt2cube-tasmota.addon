import { defineStore } from 'pinia';
import i18n from '@/i18n';
interface IEtcStoreState {
    language: 'zh-cn' | 'en-us';
    getAccessTokenVisible: boolean;
}

export const useEtcStore = defineStore('user', {
    state(): IEtcStoreState {
        return {
            language: 'zh-cn',
            getAccessTokenVisible: false,
        };
    },
    actions: {
        languageChange(lang) {
            this.language = lang;
            i18n.global.locale.value = lang;
        },
        setGetAccessTokenVisible(state: boolean) {
            this.getAccessTokenVisible = state;
        },
    },
    persist: true,
});
