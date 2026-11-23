<script setup>
import AppIcon from "./AppIcon.vue";
import { theme, toggleTheme } from "../lib/theme";

defineProps({ disabled: { type: Boolean, default: false } });
</script>

<template>
  <button
    class="theme-toggle"
    type="button"
    :aria-label="theme === 'dark' ? '切换到明亮主题' : '切换到深色主题'"
    :title="theme === 'dark' ? '切换到明亮主题' : '切换到深色主题'"
    :disabled="disabled"
    @click="toggleTheme"
  >
    <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="17" />
    <span>{{ theme === "dark" ? "明亮" : "深色" }}</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 36px;
  min-height: 36px;
  padding: 7px 10px;
  border: 1px solid var(--border-color, #e9e9ef);
  border-radius: 7px;
  background: var(--surface, #fff);
  color: var(--text-secondary, #7b7485);
  font-size: 11px;
  white-space: nowrap;
}
.theme-toggle:hover:not(:disabled) {
  background: var(--accent-soft, #f3effc);
  border-color: var(--accent-border, #d4c3ee);
  color: var(--purple);
}
@media (max-width: 780px) {
  .theme-toggle {
    padding: 7px;
  }
  .theme-toggle span {
    display: none;
  }
}
</style>
