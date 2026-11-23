<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import AppIcon from "./AppIcon.vue";

const isOpen = ref(false);
const dock = ref(null);
const trigger = ref(null);
const closeButton = ref(null);
const cards = [
  {
    title: "联系主播",
    description: "微信扫一扫，加个好友",
    src: "/support/wechat-contact.jpg",
    alt: "主播的微信好友二维码",
  },
  {
    title: "支付宝打赏",
    description: "谢谢你的支持",
    src: "/support/alipay-tip.jpg",
    alt: "主播的支付宝收款二维码",
  },
  {
    title: "微信打赏",
    description: "谢谢你的支持",
    src: "/support/wechat-tip.jpg",
    alt: "主播的微信支付收款二维码",
  },
];

async function toggle() {
  if (isOpen.value) return close(true);
  isOpen.value = true;
  await nextTick();
  closeButton.value?.focus({ preventScroll: true });
}

function close(restoreFocus = false) {
  isOpen.value = false;
  if (restoreFocus) trigger.value?.focus({ preventScroll: true });
}

function onOutsidePointer(event) {
  if (isOpen.value && !dock.value?.contains(event.target)) close();
}

function onKeydown(event) {
  if (isOpen.value && event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    close(true);
  }
}

onMounted(() => {
  document.addEventListener("pointerdown", onOutsidePointer, true);
  document.addEventListener("keydown", onKeydown, true);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onOutsidePointer, true);
  document.removeEventListener("keydown", onKeydown, true);
});
</script>

<template>
  <div ref="dock" class="creator-support">
    <Transition name="support-popover">
      <section
        v-if="isOpen"
        id="creator-support-popover"
        class="support-bubble"
        role="dialog"
        aria-labelledby="creator-support-title"
      >
        <div class="support-bubble-scroll">
          <header class="support-heading">
            <div>
              <h2 id="creator-support-title">联系 / 打赏主播</h2>
              <p>扫码联系，感谢每一份支持。</p>
            </div>
            <button
              ref="closeButton"
              class="support-close"
              type="button"
              aria-label="关闭联系与打赏气泡"
              @click="close(true)"
            >
              <AppIcon name="x" :size="18" />
            </button>
          </header>
          <div class="support-cards">
            <figure v-for="card in cards" :key="card.src" class="support-card">
              <figcaption>
                <strong>{{ card.title }}</strong>
                <span>{{ card.description }}</span>
              </figcaption>
              <img :src="card.src" :alt="card.alt" />
            </figure>
          </div>
        </div>
      </section>
    </Transition>
    <button
      ref="trigger"
      class="support-trigger"
      :class="{ 'is-open': isOpen }"
      type="button"
      aria-haspopup="dialog"
      aria-controls="creator-support-popover"
      :aria-expanded="isOpen"
      @click="toggle"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path
          d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"
        />
      </svg>
      联系 / 打赏主播
    </button>
  </div>
</template>

<style scoped>
.creator-support {
  --support-trigger-shadow: 0 5px 22px #4d357d12;
  --support-bubble-shadow: 0 16px 64px #37214e24, 0 3px 14px #37214e0a;
  position: fixed;
  left: max(24px, env(safe-area-inset-left));
  right: max(24px, env(safe-area-inset-right));
  bottom: max(24px, env(safe-area-inset-bottom));
  z-index: 30;
  display: flex;
  justify-content: flex-end;
  pointer-events: none;
}

.support-trigger {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border: 1px solid var(--border-color, #e7ddf5);
  border-radius: 999px;
  background: var(--surface-raised, #fff);
  box-shadow: var(--support-trigger-shadow);
  color: var(--purple, #7853d8);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.support-trigger:hover,
.support-trigger.is-open {
  background: var(--accent-soft, #f5efff);
  border-color: var(--accent-border, #cdb9ee);
}

.support-bubble {
  position: absolute;
  right: 0;
  bottom: calc(100% + 16px);
  width: min(760px, 100%);
  pointer-events: auto;
  border: 1px solid var(--border-color, #e6dfee);
  border-radius: 18px;
  background: var(--surface-raised, #fff);
  box-shadow: var(--support-bubble-shadow);
  transform-origin: right bottom;
}

.support-bubble::after {
  content: "";
  position: absolute;
  right: 36px;
  bottom: -7px;
  width: 13px;
  height: 13px;
  border-right: 1px solid var(--border-color, #e6dfee);
  border-bottom: 1px solid var(--border-color, #e6dfee);
  background: var(--surface-raised, #fff);
  transform: rotate(45deg);
}

.support-bubble-scroll {
  max-height: calc(100dvh - 124px);
  overflow-y: auto;
  overscroll-behavior: contain;
  border-radius: inherit;
}

.support-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 22px 18px;
}

.support-heading h2 {
  color: var(--text-primary, #3e3250);
  font-size: 17px;
  font-weight: 700;
}

.support-heading p {
  margin-top: 5px;
  color: var(--text-muted, #9b90a5);
  font-size: 11px;
}

.support-close {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  padding: 0;
  border-radius: 50%;
  background: var(--surface-subtle, #f6f2fa);
  color: var(--text-muted, #93829f);
}

.support-close:hover {
  background: var(--accent-soft, #ebe1f5);
  color: var(--purple, #7853d8);
}

.support-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: start;
  gap: 12px;
  padding: 0 20px 22px;
}

.support-card {
  min-width: 0;
  margin: 0;
  padding: 12px;
  border: 1px solid var(--border-color, #eee7f5);
  border-radius: 12px;
  background: var(--surface-subtle, #fcfaff);
}

.support-card figcaption {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.support-card strong {
  color: var(--text-secondary, #584569);
  font-size: 12px;
  font-weight: 650;
}

.support-card figcaption span {
  color: var(--text-muted, #a69aaf);
  font-size: 10px;
}

.support-card img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 5px;
  background: #fff;
}

.support-popover-enter-active,
.support-popover-leave-active {
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
}

.support-popover-enter-from,
.support-popover-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.98);
}

@media (max-width: 600px) {
  .creator-support {
    left: max(16px, env(safe-area-inset-left));
    right: max(16px, env(safe-area-inset-right));
    bottom: max(16px, env(safe-area-inset-bottom));
  }

  .support-trigger {
    padding: 11px 15px;
    font-size: 11px;
  }

  .support-bubble-scroll {
    max-height: calc(100dvh - 108px);
  }

  .support-heading {
    position: sticky;
    top: 0;
    z-index: 1;
    padding: 18px;
    border-bottom: 1px solid var(--border-color, #f1eaf7);
    background: var(--surface-raised, #fff);
  }

  .support-heading h2 {
    font-size: 15px;
  }

  .support-cards {
    grid-template-columns: 1fr;
    gap: 14px;
    padding: 16px;
  }

  .support-card {
    width: 100%;
    max-width: 340px;
    justify-self: center;
  }
}

:global(:root[data-theme="dark"] .creator-support) {
  --support-trigger-shadow: 0 5px 22px #00000040;
  --support-bubble-shadow: 0 16px 64px #00000070, 0 3px 14px #00000030;
}

@media (prefers-reduced-motion: reduce) {
  .support-popover-enter-active,
  .support-popover-leave-active,
  .support-trigger,
  .support-close {
    transition: none;
  }
}
</style>
