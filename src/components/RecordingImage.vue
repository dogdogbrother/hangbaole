<script setup>
defineProps({
  item: { type: Object, default: null },
  dragging: { type: Boolean, default: false },
});

const emit = defineEmits(["pointer-start"]);
</script>

<template>
  <div
    v-if="item"
    class="recording-floating-layer"
    :class="{ 'is-dragging': dragging }"
  >
    <div
      :key="item.id"
      class="recording-floating-image"
      draggable="false"
      role="img"
      :aria-label="`当前讲解：${item.name}，拖入档位即可完成排名`"
      :data-current-image-id="item.id"
      @pointerdown="emit('pointer-start', $event, item)"
      @dragstart.prevent
    >
      <img :src="item.src" :alt="item.name" draggable="false" />
    </div>
  </div>
</template>

<style scoped>
.recording-floating-layer {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.recording-floating-image {
  width: min(72%, 760px);
  height: min(72%, 64dvh, 640px);
  pointer-events: auto;
  cursor: grab;
  user-select: none;
  touch-action: none;
  filter: drop-shadow(0 14px 26px #30213d30);
}

.recording-floating-image:active {
  cursor: grabbing;
}

.recording-floating-image > img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
  pointer-events: none;
}

.recording-floating-layer.is-dragging {
  opacity: 0;
}

.recording-floating-layer.is-dragging .recording-floating-image {
  pointer-events: none;
}

@media (max-width: 640px) {
  .recording-floating-image {
    width: 78%;
  }
}
</style>
