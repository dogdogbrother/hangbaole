<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import AppIcon from "./components/AppIcon.vue";
import CreatorSupport from "./components/CreatorSupport.vue";
import RecordingDragPreview from "./components/RecordingDragPreview.vue";
import RecordingImage from "./components/RecordingImage.vue";
import RecordingIntro from "./components/RecordingIntro.vue";
import ThemeToggle from "./components/ThemeToggle.vue";
import { prepareImage } from "./lib/images";
import { createRecordingDrag } from "./lib/recording-drag";
import { loadDraft, saveDraft } from "./lib/storage";
import { createSampleItems, defaultTiers } from "./lib/samples";

const clone = (value) => JSON.parse(JSON.stringify(value));
const title = ref("我的零食快乐榜");
const tiers = ref(clone(defaultTiers));
const items = ref(
  createSampleItems().map((item, index) => ({
    ...item,
    tierId:
      index < 2
        ? "tier-1"
        : index < 4
          ? "tier-2"
          : index === 4
            ? "tier-3"
            : index === 5
              ? "tier-4"
              : index === 6
                ? "tier-5"
                : null,
  })),
);
const showNames = ref(false);
const isExample = ref(true);
const ready = ref(false);
const saveState = ref("loading");
const importing = ref(false);
const draggedId = ref(null);
const dragTarget = ref(undefined);
const hoveredItem = ref(null);
const fileInput = ref(null);
const titleInput = ref(null);
const dialog = ref(null);
const editingImageId = ref(null);
const imageName = ref("");
const imageTier = ref("");
const deletingTierId = ref(null);
const toast = ref("");
const toastIsError = ref(false);
const settingsHighlight = ref(null);
const recordingMode = ref(false);
const recordingStarted = ref(false);
const openingText = ref("");
const recordingDragPreview = ref(null);
let toastTimer;
let saveTimer;
let saveChain = Promise.resolve();
let changeVersion = 0;
let dialogTrigger = null;
const recordingPointerDrag = createRecordingDrag({
  onMove(preview, event) {
    draggedId.value = preview.item.id;
    recordingDragPreview.value = preview;
    const target = recordingDropTarget(event, preview.item.id);
    dragTarget.value = target?.tierId;
    hoveredItem.value = target?.hoveredId || null;
  },
  onDrop(event, item) {
    const target = recordingDropTarget(event, item.id);
    if (target && !target.isSource)
      moveImage(item.id, target.tierId, target.beforeId);
  },
  onEnd: clearDragState,
});

const unranked = computed(() =>
  items.value.filter((item) => item.tierId === null),
);
const showRecordingIntro = computed(
  () =>
    recordingMode.value && !recordingStarted.value && unranked.value.length > 0,
);
const currentRecordingItem = computed(() =>
  recordingMode.value && recordingStarted.value
    ? unranked.value[0] || null
    : null,
);
const recordingOpeningText = computed(() => openingText.value.trim());
const rankedCount = computed(() => items.value.length - unranked.value.length);
const progress = computed(() =>
  items.value.length
    ? Math.round((rankedCount.value / items.value.length) * 100)
    : 0,
);
const editingImage = computed(() =>
  items.value.find((item) => item.id === editingImageId.value),
);
const deletingTier = computed(() =>
  tiers.value.find((tier) => tier.id === deletingTierId.value),
);
const tierItems = (id) => items.value.filter((item) => item.tierId === id);
const saveLabel = computed(
  () =>
    ({
      loading: "正在读取草稿",
      saving: "正在保存…",
      saved: "已自动保存到本机",
      error: "草稿未保存",
    })[saveState.value],
);

function notify(message, error = false) {
  toast.value = message;
  toastIsError.value = error;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(
    () => {
      toast.value = "";
    },
    error ? 6500 : 3200,
  );
}

function snapshot() {
  return clone({
    version: 1,
    title: title.value,
    tiers: tiers.value,
    items: items.value,
    showNames: showNames.value,
    isExample: isExample.value,
    recordingMode: recordingMode.value,
    recordingStarted: recordingStarted.value,
    openingText: openingText.value,
  });
}

function persist() {
  if (!ready.value) return;
  clearTimeout(saveTimer);
  const version = ++changeVersion;
  const draft = snapshot();
  saveState.value = "saving";
  saveChain = saveChain
    .catch(() => {})
    .then(() => saveDraft(draft))
    .then(() => {
      if (version === changeVersion) saveState.value = "saved";
    })
    .catch((error) => {
      if (version === changeVersion) {
        saveState.value = "error";
        notify(error.message || "本地保存暂时不可用，请保留当前页面。", true);
      }
    });
}

watch(
  [
    title,
    tiers,
    items,
    showNames,
    isExample,
    recordingMode,
    recordingStarted,
    openingText,
  ],
  () => {
    if (!ready.value) return;
    changeVersion += 1;
    saveState.value = "saving";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 400);
  },
  { deep: true },
);

function validateDraft(draft) {
  if (
    !draft ||
    draft.version !== 1 ||
    typeof draft.title !== "string" ||
    !Array.isArray(draft.tiers) ||
    !Array.isArray(draft.items)
  )
    return false;
  if (
    draft.tiers.length < 1 ||
    draft.tiers.length > 10 ||
    draft.items.length > 150
  )
    return false;
  const tierIds = new Set();
  for (const tier of draft.tiers) {
    if (
      !tier ||
      typeof tier.id !== "string" ||
      tierIds.has(tier.id) ||
      typeof tier.name !== "string" ||
      !/^#[0-9a-f]{6}$/i.test(tier.color)
    )
      return false;
    tierIds.add(tier.id);
  }
  const itemIds = new Set();
  return draft.items.every((item) => {
    if (
      !item ||
      typeof item.id !== "string" ||
      itemIds.has(item.id) ||
      typeof item.name !== "string" ||
      typeof item.src !== "string"
    )
      return false;
    if (
      !/^data:image\/(?:png|jpeg|webp|gif|avif);base64,/.test(item.src) &&
      !/^\/samples\/[a-z0-9-]+\.svg$/.test(item.src)
    )
      return false;
    if (item.tierId !== null && !tierIds.has(item.tierId)) return false;
    itemIds.add(item.id);
    return true;
  });
}

onMounted(async () => {
  document.addEventListener("keydown", onKeydown);
  document.addEventListener("visibilitychange", onVisibilityChange);
  try {
    const draft = await loadDraft();
    if (validateDraft(draft)) {
      title.value = draft.title.slice(0, 50);
      tiers.value = draft.tiers;
      items.value = draft.items;
      showNames.value = Boolean(draft.showNames);
      isExample.value = Boolean(draft.isExample);
      recordingMode.value = draft.recordingMode === true;
      recordingStarted.value =
        recordingMode.value &&
        (draft.recordingStarted === true || unranked.value.length === 0);
      openingText.value =
        typeof draft.openingText === "string"
          ? draft.openingText.slice(0, 300)
          : "";
    } else if (draft !== null) {
      notify("之前的草稿无法读取，已为你打开示例榜单。", true);
    }
    await nextTick();
    ready.value = true;
    persist();
  } catch (error) {
    ready.value = true;
    saveState.value = "error";
    notify(error.message || "无法读取本地草稿，当前仍可正常编辑。", true);
  }
});

onBeforeUnmount(() => {
  endDrag();
  clearTimeout(toastTimer);
  clearTimeout(saveTimer);
  document.removeEventListener("keydown", onKeydown);
  document.removeEventListener("visibilitychange", onVisibilityChange);
});

function onVisibilityChange() {
  if (document.visibilityState === "hidden") {
    endDrag();
    if (ready.value) persist();
  }
}

function onKeydown(event) {
  if (event.key === "Escape") {
    if (event.repeat) return;
    if (dialog.value) closeDialog();
    else if (recordingPointerDrag.pending) {
      event.preventDefault();
      endDrag();
    } else if (recordingMode.value && !draggedId.value) toggleRecording();
  }
  if (event.key === "Tab" && dialog.value) {
    const focusable = [
      ...document.querySelectorAll(
        '.dialog button:not(:disabled), .dialog input, .dialog select, .dialog [tabindex="0"]',
      ),
    ];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    }
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
}

async function openDialog(type) {
  dialogTrigger = document.activeElement;
  dialog.value = type;
  await nextTick();
  document.querySelector(".dialog input, .dialog button")?.focus();
}

async function closeDialog() {
  dialog.value = null;
  await nextTick();
  if (dialogTrigger?.isConnected) dialogTrigger.focus?.();
  else titleInput.value?.focus();
}

async function importFiles(fileList, targetTier = null) {
  if (importing.value || !ready.value || recordingMode.value) return;
  const files = Array.from(fileList || []);
  if (!files.length) return;
  const available = 150 - items.value.length;
  if (available <= 0) {
    notify("一个榜单最多放入 150 张图片，请先删除一些图片。", true);
    return;
  }
  importing.value = true;
  const imported = [];
  const errors = [];
  for (const file of files.slice(0, available)) {
    try {
      const image = await prepareImage(file);
      imported.push({
        ...image,
        id: crypto.randomUUID(),
        tierId: tiers.value.some((tier) => tier.id === targetTier)
          ? targetTier
          : null,
      });
    } catch (error) {
      errors.push(`${file.name}：${error.message}`);
    }
  }
  const currentTierIds = new Set(tiers.value.map((tier) => tier.id));
  items.value.push(
    ...imported.map((item) => ({
      ...item,
      tierId: currentTierIds.has(item.tierId) ? item.tierId : null,
    })),
  );
  if (imported.length) isExample.value = false;
  importing.value = false;
  if (fileInput.value) fileInput.value.value = "";
  const skipped =
    files.length > available
      ? `，其余 ${files.length - available} 张超出数量上限`
      : "";
  if (errors.length)
    notify(
      `已添加 ${imported.length} 张图片。${errors.length} 张未能导入：${errors[0]}${skipped}`,
      true,
    );
  else if (imported.length)
    notify(`已添加 ${imported.length} 张图片${skipped}`);
}

function startDrag(event, item) {
  if (recordingMode.value) {
    event.preventDefault();
    return;
  }
  draggedId.value = item.id;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("application/x-hangbang", item.id);
  event.dataTransfer.setData("text/plain", item.id);
}

function endDrag() {
  recordingPointerDrag.cancel();
  clearDragState();
}

function clearDragState() {
  recordingDragPreview.value = null;
  draggedId.value = null;
  dragTarget.value = undefined;
  hoveredItem.value = null;
}

function startRecordingPointerDrag(event, item) {
  if (
    !recordingMode.value ||
    !recordingStarted.value ||
    (item.tierId === null && item.id !== currentRecordingItem.value?.id)
  )
    return;
  const source = event.currentTarget;
  const visual = source.querySelector(".tile-picture") || source;
  recordingPointerDrag.start(event, item, visual.getBoundingClientRect());
}

function recordingDropTarget(event, id) {
  // The preview and the floating image must not hide the row beneath them.
  const hits = document.elementsFromPoint(event.clientX, event.clientY);
  const row = hits
    .map((element) => element.closest(".tier-row[data-tier-id]"))
    .find((element) => element?.closest(".recording-mode .tier-board"));
  const tierId = row?.dataset.tierId;
  if (!tiers.value.some((tier) => tier.id === tierId)) return null;
  const tile = hits
    .map((element) => element.closest(".image-tile[data-image-id]"))
    .find((element) => element && row.contains(element));
  const hoveredId = tile?.dataset.imageId || null;
  let beforeId = hoveredId;
  if (tile && hoveredId !== id) {
    const bounds = tile.getBoundingClientRect();
    if (event.clientX > bounds.left + bounds.width / 2) {
      const group = tierItems(tierId).filter((item) => item.id !== id);
      beforeId =
        group[group.findIndex((item) => item.id === hoveredId) + 1]?.id || null;
    }
  }
  return { tierId, beforeId, hoveredId, isSource: hoveredId === id };
}

function dragOver(event, tierId, itemId = null) {
  if (recordingMode.value && !draggedId.value) return;
  if (
    !draggedId.value &&
    !Array.from(event.dataTransfer?.types || []).includes("Files")
  )
    return;
  event.preventDefault();
  event.dataTransfer.dropEffect = draggedId.value ? "move" : "copy";
  dragTarget.value = tierId;
  hoveredItem.value = itemId;
}

function moveImage(id, targetTier, beforeId = null) {
  if (id === beforeId) return;
  const index = items.value.findIndex((item) => item.id === id);
  if (index < 0) return;
  const [item] = items.value.splice(index, 1);
  item.tierId = targetTier;
  const targetItems = tierItems(targetTier);
  let insertAt = beforeId
    ? items.value.findIndex((entry) => entry.id === beforeId)
    : -1;
  if (insertAt < 0)
    insertAt = targetItems.length
      ? items.value.findIndex(
          (entry) => entry.id === targetItems[targetItems.length - 1].id,
        ) + 1
      : items.value.length;
  items.value.splice(insertAt, 0, item);
}

function dropImage(event, tierId, targetItem = null) {
  event.preventDefault();
  event.stopPropagation();
  if (recordingMode.value && !recordingStarted.value) return;
  if (event.dataTransfer.files.length) {
    if (!recordingMode.value) importFiles(event.dataTransfer.files, tierId);
  } else {
    const id =
      draggedId.value || event.dataTransfer.getData("application/x-hangbang");
    if (id === targetItem?.id) {
      endDrag();
      return;
    }
    let beforeId = targetItem?.id || null;
    if (targetItem) {
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX > bounds.left + bounds.width / 2) {
        const group = tierItems(tierId).filter((item) => item.id !== id);
        beforeId =
          group[group.findIndex((item) => item.id === targetItem.id) + 1]?.id ||
          null;
      }
    }
    if (id) moveImage(id, tierId, beforeId);
  }
  endDrag();
}

function openImage(item) {
  editingImageId.value = item.id;
  imageName.value = item.name;
  imageTier.value = item.tierId || "";
  openDialog("image");
}

function saveImage() {
  if (!editingImage.value) return closeDialog();
  const item = editingImage.value;
  item.name = imageName.value.trim() || "未命名图片";
  const targetTier = imageTier.value || null;
  if (item.tierId !== targetTier) moveImage(item.id, targetTier);
  closeDialog();
}

function deleteImage() {
  items.value = items.value.filter((item) => item.id !== editingImageId.value);
  closeDialog();
  notify("图片已删除");
}

function clearImages() {
  items.value = [];
  isExample.value = false;
  closeDialog();
  notify("图片已清空，可以上传你自己的图片了");
}

function addTier() {
  if (tiers.value.length >= 10) return;
  const palette = ["#D2BCE8", "#EDBBD2", "#A7D8D5", "#D8D5B6"];
  const tier = {
    id: crypto.randomUUID(),
    name: "新档位",
    color: palette[(tiers.value.length - 1) % 4],
  };
  tiers.value.push(tier);
  nextTick(() => {
    const input = document.getElementById(`name-${tier.id}`);
    input?.focus();
    input?.select();
  });
}

function moveTier(index, direction) {
  const next = index + direction;
  if (next < 0 || next >= tiers.value.length) return;
  const [tier] = tiers.value.splice(index, 1);
  tiers.value.splice(next, 0, tier);
}

function requestDeleteTier(tier) {
  if (tiers.value.length <= 1) return;
  deletingTierId.value = tier.id;
  openDialog("delete-tier");
}

function deleteTier() {
  if (!deletingTier.value || tiers.value.length <= 1) return closeDialog();
  for (const item of items.value)
    if (item.tierId === deletingTierId.value) item.tierId = null;
  tiers.value = tiers.value.filter((tier) => tier.id !== deletingTierId.value);
  closeDialog();
  notify("档位已删除，其中的图片已放回待排名区");
}

function editTier(tier) {
  settingsHighlight.value = tier.id;
  const input = document.getElementById(`name-${tier.id}`);
  input?.focus();
  input?.select();
  setTimeout(() => {
    settingsHighlight.value = null;
  }, 1500);
}

function normalizeTitle() {
  title.value = title.value.trim() || "我的排行榜";
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleRecording() {
  if (!ready.value || importing.value || dialog.value) return;
  endDrag();
  clearTimeout(toastTimer);
  toast.value = "";
  recordingMode.value = !recordingMode.value;
  recordingStarted.value = recordingMode.value && unranked.value.length === 0;
  // Persist the mode immediately so a refresh keeps the pending images hidden.
  persist();
  nextTick(() => window.scrollTo({ top: 0, behavior: "instant" }));
}

function startRecordingRanking() {
  if (!showRecordingIntro.value) return;
  recordingStarted.value = true;
  persist();
}

function rankCurrentImage(tierId) {
  const item = currentRecordingItem.value;
  if (
    !recordingMode.value ||
    !item ||
    !tiers.value.some((tier) => tier.id === tierId)
  )
    return;
  moveImage(item.id, tierId);
}

function labelColor(color) {
  const hex = color.replace("#", "");
  const rgb = [0, 2, 4].map((offset) =>
    parseInt(hex.slice(offset, offset + 2), 16),
  );
  return rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114 < 145
    ? "#ffffff"
    : "#443d3e";
}
</script>

<template>
  <div
    class="site-shell"
    :class="{
      'recording-mode': recordingMode,
      'pointer-dragging': Boolean(recordingDragPreview),
    }"
  >
    <button
      v-if="recordingMode && ready"
      class="recording-exit"
      aria-label="退出录制模式"
      title="退出录制模式（Esc）"
      @click="toggleRecording"
    >
      <AppIcon name="arrow-left" :size="16" />
      <span>退出录制</span><kbd>Esc</kbd>
    </button>
    <header v-if="!recordingMode" class="site-header">
      <div class="header-inner">
        <a
          class="brand"
          href="#"
          aria-label="夯榜首页"
          @click.prevent="scrollToTop"
        >
          <span class="brand-symbol"><i></i><i></i><i></i></span>
          <span class="brand-name"
            >夯榜<span class="brand-english">RANK STUDIO</span></span
          >
        </a>
        <nav class="main-nav" aria-label="主导航">
          <span class="nav-active"
            ><AppIcon name="layout" :size="16" /> 排行榜制作</span
          >
          <button v-if="!recordingMode" @click="openDialog('help')">
            使用指南 <AppIcon name="external" :size="13" />
          </button>
        </nav>
        <div class="save-status" :class="saveState" role="status">
          <span class="status-dot"></span><span>{{ saveLabel }}</span>
          <button
            v-if="saveState === 'error'"
            class="save-retry"
            @click="persist"
          >
            重试
          </button>
        </div>
        <div class="header-actions">
          <ThemeToggle :disabled="Boolean(dialog)" />
          <button
            class="button recording-toggle"
            :class="{ 'is-recording': recordingMode }"
            :aria-pressed="recordingMode"
            :disabled="!ready || importing || Boolean(dialog)"
            @click="toggleRecording"
          >
            <AppIcon :name="recordingMode ? 'x' : 'play'" :size="15" />
            {{ recordingMode ? "退出录制模式" : "录制模式" }}
          </button>
        </div>
      </div>
    </header>

    <main v-if="ready" class="page-content" :inert="dialog ? true : undefined">
      <section v-if="!recordingMode" class="intro">
        <div class="intro-copy">
          <div class="eyebrow">
            <span></span> EVERY OPINION DESERVES A TIER.
          </div>
          <h1>
            万物皆可，<span>从夯到拉。</span
            ><span class="heading-spark">✦</span>
          </h1>
          <p>上传图片，拖拽排名。把你的喜好，排得明明白白。</p>
        </div>
        <div class="intro-art" aria-hidden="true">
          <span class="art-caption">YOUR TASTE.<br />YOUR RULES.</span>
          <div class="mini-board">
            <div><b>S</b><i></i><i></i><i></i></div>
            <div><b>A</b><i></i><i></i></div>
            <div><b>B</b><i></i></div>
            <div><b>C</b><i></i><i></i></div>
            <div><b>D</b><i></i></div>
          </div>
          <span class="art-spark">✳</span><span class="art-dot"></span>
        </div>
      </section>

      <div class="editor-layout">
        <div class="main-column">
          <section class="ranking-card panel" aria-label="排行榜编辑器">
            <div class="board-toolbar">
              <div class="board-heading">
                <div class="title-line">
                  <input
                    ref="titleInput"
                    v-model="title"
                    class="board-title"
                    aria-label="排行榜标题"
                    :readonly="recordingMode"
                    maxlength="50"
                    placeholder="给你的排行榜起个名字"
                    @blur="normalizeTitle"
                  /><button
                    v-if="!recordingMode"
                    class="icon-button title-edit"
                    aria-label="修改排行榜标题"
                    @click="titleInput?.focus()"
                  >
                    <AppIcon name="pencil" :size="15" />
                  </button>
                </div>
                <div v-if="!recordingMode" class="board-meta">
                  <span>{{ items.length }} 张图片</span><i></i
                  ><span>{{ tiers.length }} 个档位</span
                  ><button
                    v-if="isExample && !recordingMode"
                    class="example-tag"
                    :disabled="importing"
                    @click="openDialog('clear-images')"
                  >
                    示例榜单 · 清空示例 <AppIcon name="x" :size="10" />
                  </button>
                </div>
              </div>
              <span v-if="!recordingMode" class="drag-instruction"
                ><AppIcon name="move" :size="15" />
                {{
                  recordingMode
                    ? "讲解后，将当前图片拖入档位"
                    : "拖一拖，排出你的态度"
                }}</span
              >
            </div>

            <div v-if="!recordingMode" class="opening-editor">
              <label for="opening-text">录制开场白 <span>选填</span></label>
              <textarea
                id="opening-text"
                v-model="openingText"
                rows="2"
                maxlength="300"
              ></textarea>
              <p>留空时仅展示主题标题，点击“开始排名”再揭晓图片。</p>
            </div>

            <div
              class="tier-board"
              :class="{ 'with-names': showNames }"
              :style="{ '--recording-tier-count': tiers.length }"
            >
              <div
                v-for="tier in tiers"
                :key="tier.id"
                class="tier-row"
                :class="{ 'drop-active': dragTarget === tier.id }"
                :data-tier-id="tier.id"
                @dragover="dragOver($event, tier.id)"
                @drop="dropImage($event, tier.id)"
              >
                <button
                  class="tier-label"
                  :disabled="recordingMode && !currentRecordingItem"
                  :style="{
                    backgroundColor: tier.color,
                    color: labelColor(tier.color),
                  }"
                  :aria-label="
                    recordingMode
                      ? currentRecordingItem
                        ? `将${currentRecordingItem.name}排入${tier.name}档位`
                        : tier.name
                      : `编辑${tier.name}档位`
                  "
                  @click="
                    recordingMode ? rankCurrentImage(tier.id) : editTier(tier)
                  "
                >
                  <span>{{ tier.name || "未命名" }}</span
                  ><AppIcon class="tier-edit-icon" name="pencil" :size="12" />
                </button>
                <div class="tier-content">
                  <button
                    v-for="item in tierItems(tier.id)"
                    :key="item.id"
                    class="image-tile"
                    :class="{
                      dragging: draggedId === item.id,
                      'drop-before':
                        hoveredItem === item.id && draggedId !== item.id,
                    }"
                    :draggable="!recordingMode"
                    :aria-label="
                      recordingMode
                        ? `已排名：${item.name}`
                        : `编辑图片：${item.name}`
                    "
                    :title="
                      recordingMode
                        ? `${item.name} · 拖拽调整排名`
                        : `${item.name} · 点击编辑，拖拽排序`
                    "
                    :data-image-id="item.id"
                    @pointerdown="startRecordingPointerDrag($event, item)"
                    @dragstart="startDrag($event, item)"
                    @dragend="endDrag"
                    @dragover.stop="dragOver($event, tier.id, item.id)"
                    @drop.stop="dropImage($event, tier.id, item)"
                    @click="!recordingMode && openImage(item)"
                  >
                    <span class="tile-picture"
                      ><img
                        :src="item.src"
                        :alt="item.name"
                        draggable="false" /><span class="tile-hover"
                        ><AppIcon name="pencil" :size="15" /></span
                    ></span>
                    <span v-if="showNames" class="tile-name">{{
                      item.name
                    }}</span>
                  </button>
                  <span v-if="!tierItems(tier.id).length" class="empty-tier"
                    ><AppIcon name="plus" :size="17" /><span
                      >把图片拖到这里</span
                    ></span
                  >
                </div>
                <span class="tier-count">{{
                  tierItems(tier.id).length || "—"
                }}</span>
              </div>
              <RecordingIntro
                v-if="showRecordingIntro"
                :title="title"
                :description="recordingOpeningText"
                @start="startRecordingRanking"
              />
              <RecordingImage
                v-else-if="recordingMode"
                :item="currentRecordingItem"
                :dragging="
                  Boolean(draggedId && draggedId === currentRecordingItem?.id)
                "
                @pointer-start="startRecordingPointerDrag"
              />
              <RecordingDragPreview :drag="recordingDragPreview" />
            </div>

            <p
              v-if="recordingMode && !unranked.length"
              class="visually-hidden"
              role="status"
            >
              {{ items.length ? "全部排名完成" : "还没有待排名图片" }}
            </p>

            <div v-if="!recordingMode" class="board-footer">
              <span
                ><span class="tiny-purple-dot"></span>
                {{
                  rankedCount === items.length && items.length
                    ? "全部排好了，你的态度已就位！"
                    : "没有标准答案，喜欢就是最高档。"
                }}</span
              >
              <div class="ranking-progress">
                <span
                  >已排名 <strong>{{ rankedCount }}</strong> /
                  {{ items.length }}</span
                ><span class="progress-track"
                  ><i :style="{ width: `${progress}%` }"></i
                ></span>
              </div>
            </div>
          </section>

          <section
            v-if="!recordingMode"
            class="image-pool panel"
            :class="{ 'pool-drop-active': dragTarget === null }"
            aria-label="待排名图片"
            data-tier-id="pool"
            @dragover="dragOver($event, null)"
            @dragleave.self="dragTarget = undefined"
            @drop="dropImage($event, null)"
          >
            <div class="pool-toolbar">
              <div class="section-title">
                <AppIcon name="images" :size="19" />
                <h2>待排名图片</h2>
                <span class="count-badge">{{ unranked.length }}</span>
              </div>
              <div class="pool-actions">
                <button
                  class="name-toggle"
                  role="switch"
                  :aria-checked="showNames"
                  @click="showNames = !showNames"
                >
                  <span class="switch-track" :class="{ checked: showNames }"
                    ><i></i></span
                  >显示名称</button
                ><button
                  class="icon-button clear-images"
                  :disabled="importing || !items.length"
                  aria-label="清空所有图片"
                  title="清空所有图片"
                  @click="openDialog('clear-images')"
                >
                  <AppIcon name="trash" :size="15" /></button
                ><button
                  class="button primary upload-button"
                  :disabled="importing"
                  @click="fileInput?.click()"
                >
                  <AppIcon :name="importing ? 'more' : 'plus'" :size="17" />{{
                    importing ? "正在导入…" : "上传图片"
                  }}
                </button>
              </div>
            </div>
            <div class="pool-items" :class="{ 'with-names': showNames }">
              <button
                v-for="item in unranked"
                :key="item.id"
                class="image-tile"
                :class="{
                  dragging: draggedId === item.id,
                  'drop-before':
                    hoveredItem === item.id && draggedId !== item.id,
                }"
                draggable="true"
                :aria-label="`编辑图片：${item.name}`"
                :title="`${item.name} · 点击编辑，拖拽排序`"
                :data-image-id="item.id"
                @dragstart="startDrag($event, item)"
                @dragend="endDrag"
                @dragover.stop="dragOver($event, null, item.id)"
                @drop.stop="dropImage($event, null, item)"
                @click="openImage(item)"
              >
                <span class="tile-picture"
                  ><img
                    :src="item.src"
                    :alt="item.name"
                    draggable="false" /><span class="tile-hover"
                    ><AppIcon name="pencil" :size="15" /></span></span
                ><span v-if="showNames" class="tile-name">{{ item.name }}</span>
              </button>
              <button
                class="add-image-tile"
                :disabled="importing"
                aria-label="添加图片"
                @click="fileInput?.click()"
              >
                <AppIcon name="plus" :size="23" /><span>添加图片</span>
              </button>
              <div v-if="!unranked.length" class="pool-empty-copy">
                <strong>{{
                  items.length
                    ? "每一张，都有了自己的位置。"
                    : "你的排行榜，从第一张图片开始。"
                }}</strong
                ><span>{{
                  items.length
                    ? "继续添加图片，或者把榜单中的图片拖回这里。"
                    : "点击上传，或把准备好的图片拖进来。"
                }}</span>
              </div>
            </div>
            <div class="upload-hint">
              <AppIcon name="upload" :size="13" /><span
                >也可以直接拖入图片文件</span
              ><i></i><span>JPG、PNG、WebP、GIF 等，每张不超过 15 MB</span>
            </div>
            <input
              ref="fileInput"
              class="visually-hidden"
              type="file"
              accept="image/*"
              multiple
              aria-label="批量上传图片"
              @change="importFiles($event.target.files)"
            />
          </section>

          <div v-if="!recordingMode" class="workspace-note">
            <AppIcon name="shield" :size="14" /><span
              >图片仅在当前浏览器中处理和保存，放心表达你的喜好。</span
            ><span class="note-shortcut">点击图片可重命名、移动或删除</span>
          </div>
        </div>

        <aside v-if="!recordingMode" class="sidebar">
          <section class="settings-card panel">
            <div class="settings-heading">
              <div class="section-title">
                <AppIcon name="settings" :size="19" />
                <h2>档位设置</h2>
              </div>
              <span class="subtle-label">{{ tiers.length }} / 10</span>
            </div>
            <p class="settings-description">每一个档位，都可以有你的个性。</p>
            <div class="tier-settings">
              <div
                v-for="(tier, index) in tiers"
                :key="tier.id"
                class="tier-setting-row"
                :class="{ highlighted: settingsHighlight === tier.id }"
              >
                <label
                  class="color-swatch"
                  :style="{ backgroundColor: tier.color }"
                  :title="`修改${tier.name}的颜色`"
                  ><input
                    v-model="tier.color"
                    type="color"
                    :aria-label="`${tier.name}档位颜色`" /><AppIcon
                    name="chevron-down"
                    :size="11"
                /></label>
                <input
                  :id="`name-${tier.id}`"
                  v-model="tier.name"
                  class="tier-name-input"
                  :aria-label="`第${index + 1}档名称`"
                  maxlength="8"
                  @blur="tier.name = tier.name.trim() || '未命名'"
                />
                <div class="tier-order-buttons">
                  <button
                    class="icon-button"
                    :disabled="index === 0"
                    :aria-label="`上移${tier.name}档位`"
                    @click="moveTier(index, -1)"
                  >
                    <AppIcon name="chevron-up" :size="12" /></button
                  ><button
                    class="icon-button"
                    :disabled="index === tiers.length - 1"
                    :aria-label="`下移${tier.name}档位`"
                    @click="moveTier(index, 1)"
                  >
                    <AppIcon name="chevron-down" :size="12" />
                  </button>
                </div>
                <button
                  class="icon-button tier-delete"
                  :disabled="tiers.length <= 1"
                  :aria-label="`删除${tier.name}档位`"
                  @click="requestDeleteTier(tier)"
                >
                  <AppIcon name="x" :size="14" />
                </button>
              </div>
            </div>
            <button
              class="add-tier-button"
              :disabled="tiers.length >= 10"
              @click="addTier"
            >
              <AppIcon name="plus" :size="16" />{{
                tiers.length >= 10 ? "已达到 10 个档位上限" : "添加一个档位"
              }}
            </button>
            <div class="settings-footnote">
              <AppIcon name="image" :size="13" /><span
                >删除档位后，图片会回到待排名区。</span
              >
            </div>
          </section>

          <section class="howto-card">
            <div class="howto-heading">
              <span class="howto-icon"
                ><AppIcon name="sparkles" :size="17"
              /></span>
              <h2>三步，排出你的态度</h2>
            </div>
            <ol>
              <li>
                <span>01</span>
                <div>
                  <strong>准备你的图片</strong>
                  <p>美食、游戏、角色……万物皆可排。</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>拖进对应档位</strong>
                  <p>从夯到拉，心中自有高低。</p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>做成你的风格</strong>
                  <p>改个标题，给档位一点个性。</p>
                </div>
              </li>
            </ol>
            <button class="help-link" @click="openDialog('help')">
              第一次使用？看看小指南 <AppIcon name="arrow-right" :size="14" />
            </button>
          </section>
          <div class="sidebar-signature">
            <span class="signature-mark">✳</span>
            <p>排名有高低，<br />热爱不设限。</p>
            <span>MADE FOR YOUR OPINIONS.</span>
          </div>
        </aside>
      </div>

      <footer v-if="!recordingMode" class="site-footer">
        <span>夯榜 <i>© 2026</i></span
        ><span>一点主观，十分有趣。</span
        ><button @click="openDialog('help')">
          使用指南 <AppIcon name="arrow-right" :size="12" />
        </button>
      </footer>
    </main>

    <CreatorSupport v-if="ready && !recordingMode && !dialog" />

    <div v-if="!ready" class="loading-state" role="status">
      <span class="loading-spinner"></span>正在打开你的工作台…
    </div>

    <Transition name="toast"
      ><div
        v-if="toast"
        class="toast-message"
        :class="{ error: toastIsError }"
        role="status"
      >
        <AppIcon
          :name="toastIsError ? 'help' : 'check-circle'"
          :size="18"
        /><span>{{ toast }}</span
        ><button class="icon-button" aria-label="关闭提示" @click="toast = ''">
          <AppIcon name="x" :size="15" />
        </button></div
    ></Transition>

    <Transition name="modal"
      ><div v-if="dialog" class="dialog-overlay" @mousedown.self="closeDialog">
        <section
          class="dialog"
          :class="{ 'image-dialog': dialog === 'image' }"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
        >
          <button
            class="icon-button dialog-close"
            aria-label="关闭对话框"
            @click="closeDialog"
          >
            <AppIcon name="x" :size="20" />
          </button>
          <template v-if="dialog === 'image' && editingImage">
            <span class="dialog-eyebrow">MAKE IT YOURS</span>
            <h2 id="dialog-title">编辑图片</h2>
            <p class="dialog-description">给它起个名字，或者换个位置。</p>
            <div class="image-edit-preview">
              <img :src="editingImage.src" :alt="editingImage.name" />
            </div>
            <form @submit.prevent="saveImage">
              <label class="form-label" for="image-name">图片名称</label
              ><input
                id="image-name"
                v-model="imageName"
                class="form-input"
                maxlength="60"
                placeholder="给这张图片起个名字"
              /><label class="form-label" for="image-tier">所在档位</label
              ><select id="image-tier" v-model="imageTier" class="form-input">
                <option value="">待排名区</option>
                <option v-for="tier in tiers" :key="tier.id" :value="tier.id">
                  {{ tier.name }}
                </option>
              </select>
              <div class="dialog-actions">
                <button
                  type="button"
                  class="button danger-ghost"
                  @click="deleteImage"
                >
                  <AppIcon name="trash" :size="15" />删除图片</button
                ><button type="submit" class="button primary">
                  保存修改<AppIcon name="check" :size="16" />
                </button>
              </div>
            </form>
          </template>
          <template v-else-if="dialog === 'delete-tier' && deletingTier">
            <span class="delete-dialog-icon"
              ><AppIcon name="trash" :size="24"
            /></span>
            <h2 id="dialog-title">删除「{{ deletingTier.name }}」档位？</h2>
            <p class="dialog-description">
              这个档位中的
              {{ tierItems(deletingTier.id).length }}
              张图片会回到待排名区，你可以重新为它们排名。
            </p>
            <div class="dialog-actions align-right">
              <button class="button secondary" @click="closeDialog">
                再想想</button
              ><button class="button danger" @click="deleteTier">
                删除档位
              </button>
            </div>
          </template>
          <template v-else-if="dialog === 'clear-images'">
            <span class="delete-dialog-icon"
              ><AppIcon name="images" :size="24"
            /></span>
            <h2 id="dialog-title">
              {{
                isExample
                  ? "清空示例，开始你的排名？"
                  : "清空榜单中的所有图片？"
              }}
            </h2>
            <p class="dialog-description">
              将移除全部
              {{ items.length }}
              张图片，保留当前标题和档位设置。然后就可以上传你自己准备的图片了。
            </p>
            <div class="dialog-actions align-right">
              <button class="button secondary" @click="closeDialog">取消</button
              ><button class="button danger" @click="clearImages">
                清空图片
              </button>
            </div>
          </template>
          <template v-else>
            <span class="dialog-eyebrow">A QUICK START</span>
            <h2 id="dialog-title">你的第一张夯榜</h2>
            <p class="dialog-description">
              没有复杂规则，只需要一点自己的态度。
            </p>
            <div class="guide-steps">
              <div>
                <span>1</span>
                <section>
                  <h3>上传你准备好的图片</h3>
                  <p>
                    点击“上传图片”批量选择，或直接把图片文件拖进待排名区。首次打开时的零食插图可以用“清空示例”一键移除。
                  </p>
                </section>
              </div>
              <div>
                <span>2</span>
                <section>
                  <h3>拖拽，决定它的位置</h3>
                  <p>
                    图片可以在档位之间移动，也可以在同一档内调整先后。点击图片，还能重命名、选择档位或删除。
                  </p>
                </section>
              </div>
              <div>
                <span>3</span>
                <section>
                  <h3>让榜单带上你的名字</h3>
                  <p>
                    点击榜单标题就能修改。右侧可改档位名称、颜色和顺序，也能增删档位，最多保留
                    10 档。
                  </p>
                </section>
              </div>
            </div>
            <div class="guide-privacy">
              <AppIcon name="shield" :size="18" />
              <p>
                修改会自动保存在当前浏览器。下次使用相同浏览器、打开相同网址即可继续；清除网站数据或使用无痕模式可能丢失草稿。
              </p>
            </div>
            <button class="button primary guide-start" @click="closeDialog">
              明白了，开始排名<AppIcon name="arrow-right" :size="16" />
            </button>
          </template>
        </section></div
    ></Transition>
  </div>
</template>
