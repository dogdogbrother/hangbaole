import { ref } from "vue";

export const theme = ref(
  document.documentElement.dataset.theme === "dark" ? "dark" : "light",
);

export function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = theme.value;
  document.querySelector('meta[name="theme-color"]').content =
    theme.value === "dark" ? "#111218" : "#f7f8fa";
  try {
    localStorage.setItem("hangbang-theme", theme.value);
  } catch {
    // Theme switching remains available when browser storage is unavailable.
  }
}
