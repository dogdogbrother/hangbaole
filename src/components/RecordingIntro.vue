<script setup>
import AppIcon from "./AppIcon.vue";

defineProps({
  title: { type: String, required: true },
  description: { type: String, default: "" },
});

defineEmits(["start"]);
</script>

<template>
  <div class="recording-intro-layer">
    <section class="recording-intro" aria-labelledby="recording-intro-title">
      <span class="recording-intro-label">今日主题</span>
      <h2 id="recording-intro-title">{{ title }}</h2>
      <p v-if="description" class="recording-intro-description">
        {{ description }}
      </p>
      <button class="recording-start" type="button" @click="$emit('start')">
        <AppIcon name="play" :size="17" />
        开始排名
      </button>
    </section>
  </div>
</template>

<style scoped>
.recording-intro-layer {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 120px;
  pointer-events: none;
}

.recording-intro {
  width: 100%;
  max-width: 560px;
  max-height: min(88%, calc(100dvh - 180px));
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 36px 40px;
  border: 1px solid var(--accent-border, #e8dff6);
  border-radius: 18px;
  background: var(--surface, #fff);
  box-shadow: 0 18px 60px #30213d1a;
  text-align: center;
  pointer-events: auto;
}

.recording-intro-label {
  display: inline-block;
  margin-bottom: 14px;
  color: var(--purple, #7853d8);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 3px;
}

.recording-intro h2 {
  color: var(--text-primary, #282733);
  font-size: clamp(24px, 2.7vw, 38px);
  font-weight: 750;
  line-height: 1.45;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.recording-intro-description {
  margin: 18px 0 0;
  color: var(--text-secondary, #777180);
  font-size: 15px;
  line-height: 1.9;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.recording-start {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  margin-top: 28px;
  padding: 12px 24px;
  border: 1px solid transparent;
  border-radius: 9px;
  background: #7853d8;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
}

.recording-start:hover {
  background: #6842c7;
}

:global(:root[data-theme="dark"] .recording-intro) {
  box-shadow: 0 18px 60px #00000055;
}

:global(:root[data-theme="dark"] .recording-start) {
  background: #8459cd;
}

:global(:root[data-theme="dark"] .recording-start:hover) {
  background: #9269d8;
}

@media (max-width: 640px) {
  .recording-intro-layer {
    padding: 16px 16px 16px 96px;
  }

  .recording-intro {
    padding: 25px 20px;
    border-radius: 13px;
  }

  .recording-intro h2 {
    font-size: 24px;
  }

  .recording-intro-description {
    font-size: 12px;
    line-height: 1.8;
  }

  .recording-start {
    margin-top: 22px;
    padding: 11px 18px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .recording-intro-layer {
    padding-left: 84px;
    padding-right: 12px;
  }
}

@media (max-height: 600px) {
  .recording-intro {
    padding: 20px 24px;
  }

  .recording-intro-label {
    margin-bottom: 8px;
  }

  .recording-intro h2 {
    font-size: 25px;
  }

  .recording-intro-description {
    margin-top: 10px;
    font-size: 12px;
  }

  .recording-start {
    margin-top: 16px;
    padding-block: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .recording-start {
    transition: none;
  }
}
</style>
