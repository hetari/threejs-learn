<script setup lang="ts">
import { KeepAlive, provide, onMounted, onUnmounted } from "vue";
import { RouterView } from "vue-router";
import Stats from "stats.js";

let stats = new Stats();

function setupStats(s: Stats) {
  s.dom.style.pointerEvents = 'none';
  s.dom.style.left = 'auto';
  s.dom.style.right = '0px';
  Array.from(s.dom.children).forEach((child) => {
    (child as HTMLElement).style.display = 'inline-block';
  });
  document.body.appendChild(s.dom);
}

const statsWrapper = {
  begin: () => stats.begin(),
  end: () => stats.end(),
  update: () => stats.update(),
  reset: () => {
    if (stats.dom.parentNode) {
      document.body.removeChild(stats.dom);
    }
    stats = new Stats();
    setupStats(stats);
  }
};

provide('stats', statsWrapper);

onMounted(() => {
  setupStats(stats);
});

onUnmounted(() => {
  if (stats.dom.parentNode) {
    document.body.removeChild(stats.dom);
  }
});
</script>

<template>
  <RouterView v-slot="{ Component }">
    <KeepAlive include="IndexPage">
      <component :is="Component" />
    </KeepAlive>
  </RouterView>
</template>
