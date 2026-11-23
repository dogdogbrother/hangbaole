export const defaultTiers = [
  { id: "tier-1", name: "夯", color: "#F5A5A0" },
  { id: "tier-2", name: "顶级", color: "#F6C18C" },
  { id: "tier-3", name: "人上人", color: "#F5DB8A" },
  { id: "tier-4", name: "NPC", color: "#B8D9B5" },
  { id: "tier-5", name: "拉完了", color: "#A9C9E8" },
];

export const sampleItems = [
  {
    id: "sample-chips",
    name: "原味薯片",
    src: "/samples/chips.svg",
    tierId: null,
  },
  {
    id: "sample-cookies",
    name: "夹心饼干",
    src: "/samples/cookies.svg",
    tierId: null,
  },
  {
    id: "sample-chocolate",
    name: "牛奶巧克力",
    src: "/samples/chocolate.svg",
    tierId: null,
  },
  {
    id: "sample-peach",
    name: "白桃乌龙",
    src: "/samples/peach.svg",
    tierId: null,
  },
  {
    id: "sample-gummy",
    name: "果汁软糖",
    src: "/samples/gummy.svg",
    tierId: null,
  },
  {
    id: "sample-matcha",
    name: "抹茶饼干",
    src: "/samples/matcha.svg",
    tierId: null,
  },
  {
    id: "sample-cola",
    name: "快乐可乐",
    src: "/samples/cola.svg",
    tierId: null,
  },
  {
    id: "sample-icecream",
    name: "香草冰淇淋",
    src: "/samples/icecream.svg",
    tierId: null,
  },
  {
    id: "sample-noodles",
    name: "红烧牛肉面",
    src: "/samples/noodles.svg",
    tierId: null,
  },
  {
    id: "sample-popcorn",
    name: "焦糖爆米花",
    src: "/samples/popcorn.svg",
    tierId: null,
  },
  {
    id: "sample-croissant",
    name: "黄油可颂",
    src: "/samples/croissant.svg",
    tierId: null,
  },
  {
    id: "sample-coffee",
    name: "生椰拿铁",
    src: "/samples/coffee.svg",
    tierId: null,
  },
];

export function createSampleItems() {
  return sampleItems.map((item) => ({ ...item, tierId: null }));
}
