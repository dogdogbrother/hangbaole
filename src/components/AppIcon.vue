<script setup>
defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 18 },
  strokeWidth: { type: [Number, String], default: 1.7 },
});

const icons = {
  "arrow-right": ["M5 12h14", "m12 5 7 7-7 7"],
  "arrow-left": ["M19 12H5", "m12 19-7-7 7-7"],
  "chevron-down": ["m6 9 6 6 6-6"],
  "chevron-up": ["m6 15 6-6 6 6"],
  plus: ["M12 5v14", "M5 12h14"],
  x: ["m6 6 12 12", "M18 6 6 18"],
  check: ["m5 12 4 4L19 6"],
  upload: [
    "M12 16V3",
    "m7 8 5-5 5 5",
    "M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4",
  ],
  download: [
    "M12 3v13",
    "m7 11 5 5 5-5",
    "M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4",
  ],
  image: [
    "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z",
    "m3 16 5-5 4 4 3-3 6 6",
    "M8 7h.01",
  ],
  images: [
    "M8 3h11a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z",
    "M3 8v11a2 2 0 0 0 2 2h11",
    "m6 13 4-4 4 4 3-3 4 4",
    "M11 6h.01",
  ],
  grip: ["M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01"],
  undo: ["M3 10h10a7 7 0 0 1 0 14", "m7 5-5 5 5 5"],
  redo: ["M21 10H11a7 7 0 0 0 0 14", "m17 5 5 5-5 5"],
  settings: [
    "M9.7 4.4 10.5 2h3l.8 2.4 2.3 1.3 2.5-.5 1.5 2.6-1.7 1.9v2.6l1.7 1.9-1.5 2.6-2.5-.5-2.3 1.3-.8 2.4h-3l-.8-2.4-2.3-1.3-2.5.5-1.5-2.6 1.7-1.9V9.7L3.4 7.8l1.5-2.6 2.5.5 2.3-1.3Z",
    "M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  ],
  trash: ["M3 6h18", "M9 6V3h6v3", "m5 6 1 15h12l1-15", "M10 10v7M14 10v7"],
  help: [
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
    "M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4",
    "M12 17h.01",
  ],
  external: [
    "M14 3h7v7",
    "m10 14 11-11",
    "M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5",
  ],
  eye: [
    "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z",
    "M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  ],
  sun: [
    "M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
    "M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  ],
  moon: ["M20.8 13.1A9 9 0 0 1 10.9 3.2 9 9 0 1 0 20.8 13.1Z"],
  copy: ["M9 9h12v12H9V9Z", "M15 5V3H3v12h2"],
  "check-circle": ["M21 11.1V12a9 9 0 1 1-5.3-8.2", "m9 11 3 3L22 4"],
  layout: ["M3 3h18v18H3V3Z", "M3 9h18M9 9v12"],
  sparkles: [
    "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z",
    "M20 2v4M18 4h4",
  ],
  pencil: ["m16 3 5 5-12 12-6 1 1-6L16 3Z", "m13 6 5 5"],
  keyboard: [
    "M3 5h18v14H3V5Z",
    "M7 9h.01M11 9h.01M15 9h.01M18 9h.01M7 12h.01M11 12h.01M15 12h.01M18 12h.01M8 15h8",
  ],
  reset: ["M3 11a9 9 0 1 1 2.3 7", "M3 4v7h7"],
  grid: ["M3 3h7v7H3V3ZM14 3h7v7h-7V3ZM3 14h7v7H3v-7ZM14 14h7v7h-7v-7Z"],
  folder: [
    "M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z",
  ],
  play: ["m8 4 12 8-12 8V4Z"],
  move: [
    "M12 3v18M3 12h18",
    "m8 7 4-4 4 4M8 17l4 4 4-4M7 8l-4 4 4 4M17 8l4 4-4 4",
  ],
  more: ["M5 12h.01M12 12h.01M19 12h.01"],
  shield: ["m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z", "m8 12 3 3 5-6"],
  maximize: ["M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"],
};
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path
      v-for="(path, index) in icons[name] || icons.image"
      :key="index"
      :d="path"
    />
  </svg>
</template>
