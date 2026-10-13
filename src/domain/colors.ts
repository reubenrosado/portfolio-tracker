import { clamp } from "./format";

/** Stable family colors. Assigned to parent themes and kept when they are reordered. */
export const PARENT_PALETTE = [
  "#1F6FEB",
  "#E39B2B",
  "#8C6A2F",
  "#1F8A70",
  "#3D5A80",
  "#C4494A",
  "#6D597A",
  "#2F6F4E",
  "#C46B3A",
  "#4E6E8A",
  "#8E4A63",
  "#3E7CB1",
] as const;

export const GAP_COLOR = "#D9D2C5";

export function nextParentColor(used: Array<string | null>): string {
  const taken = new Set(used.filter((color): color is string => Boolean(color)));
  const available = PARENT_PALETTE.find((color) => !taken.has(color));
  return available ?? PARENT_PALETTE[taken.size % PARENT_PALETTE.length];
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function rgbToHex(red: number, green: number, blue: number): string {
  const channel = (value: number) =>
    clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
  return `#${channel(red)}${channel(green)}${channel(blue)}`;
}

export function mixHex(base: string, target: string, amount: number): string {
  const [baseRed, baseGreen, baseBlue] = hexToRgb(base);
  const [targetRed, targetGreen, targetBlue] = hexToRgb(target);
  const ratio = clamp(amount, 0, 1);
  return rgbToHex(
    baseRed + (targetRed - baseRed) * ratio,
    baseGreen + (targetGreen - baseGreen) * ratio,
    baseBlue + (targetBlue - baseBlue) * ratio,
  );
}

/** Lighter to darker shades of a parent color, one per child slice. */
export function childShade(base: string, index: number, count: number): string {
  if (count <= 1) return mixHex(base, "#fffaf4", 0.22);
  const progress = index / (count - 1);
  if (progress <= 0.55) {
    return mixHex(base, "#fffaf4", 0.48 - progress * 0.7);
  }
  return mixHex(base, "#1b140e", (progress - 0.45) * 0.55);
}
