<script setup lang="ts">
import { RouterView } from 'vue-router';
import { useEtcStore } from '@/stores/etc';

const etcStore = useEtcStore();

onMounted(() => {
    // 语言跟随浏览器
    // const browserLanguage = navigator.language;
    let browserLanguage = window.location.search;

    if (!browserLanguage) {
        browserLanguage = navigator.language;
    }

    if (browserLanguage.includes('zh')) {
        etcStore.languageChange('zh-cn');
    } else {
        etcStore.languageChange('en-us');
    }
    console.log('current language', etcStore.language);
});
</script>

<template>
    <RouterView />
</template>
