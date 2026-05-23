<script setup lang="ts">
import { KeepAlive } from "vue";
import { RouterView } from "vue-router";
</script>

<template>
  <RouterView v-slot="{ Component }">
    <KeepAlive include="IndexPage">
      <component :is="Component" />
    </KeepAlive>
  </RouterView>
</template>
