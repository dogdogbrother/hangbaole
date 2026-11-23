<script setup>
defineProps({
  drag: { type: Object, default: null },
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="drag"
      class="recording-drag-preview"
      :style="{
        left: `${drag.x}px`,
        top: `${drag.y}px`,
        width: `${drag.width}px`,
        height: `${drag.height}px`,
      }"
      aria-hidden="true"
    >
      <img :src="drag.item.src" :alt="drag.item.name" draggable="false" />
    </div>
  </Teleport>
</template>

<style scoped>
.recording-drag-preview {
  position: fixed;
  z-index: 100;
  pointer-events: none;
  user-select: none;
  opacity: 1;
  filter: drop-shadow(0 14px 26px #30213d30);
}

.recording-drag-preview > img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
  pointer-events: none;
}
</style>
