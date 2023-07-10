<script setup lang="ts">
import { RouterView } from 'vue-router';
import { useEtcStore } from '@/stores/etc';

const etcStore = useEtcStore();

onMounted(() => {
    // 语言跟随浏览器
    // const browserLanguage = navigator.language;
    let browserLanguage = window.location.search;
    console.log('browserLanguage init', browserLanguage);
    console.log('browser href', window.location.href);

    if (!browserLanguage) {
        browserLanguage = navigator.language;
        console.log('browserLanguage', browserLanguage);
    }

    if (browserLanguage.includes('zh')) {
        console.log(111);
        // etcStore.languageChange('en-us');
        etcStore.languageChange('zh-cn');
    } else {
        console.log(222);
        etcStore.languageChange('en-us');
    }
    console.log(etcStore.language, '当前语言');
});
</script>

<template>
    <RouterView />
</template>
