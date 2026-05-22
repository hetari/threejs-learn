<script setup lang="ts"></script>

<template>
  <!-- <TresPerspectiveCamera :position="[5, 5, 5]" :look-at="[0, 0, 0]" /> -->
  <TresMesh :rotation="[-Math.PI / 4, 0, 0]">
    <TresBoxGeometry :args="[2, 2, 2]" />
    <TresMeshBasicMaterial color="hotpink" />
  </TresMesh>
  <TresAmbientLight />
</template>
