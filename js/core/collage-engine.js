export const layouts = [
  { id: "frame", name: "Khung gốc" },
  { id: "single", name: "Một ảnh" },
  { id: "grid-2", name: "Grid 2" },
  { id: "grid-3", name: "Grid 3" },
  { id: "grid-4", name: "Grid 4" },
  { id: "vertical-strip", name: "Dải dọc" },
  { id: "horizontal-strip", name: "Dải ngang" }
];

export function getCollageSlots(layout, frame, photoCount) {
  if (layout === "frame") return null;
  const width = frame?.width || 1200;
  const height = frame?.height || 1800;
  const margin = 64;
  const gap = 24;
  const count = layout === "single"
    ? 1
    : layout === "grid-2"
      ? 2
      : layout === "grid-3"
        ? 3
        : layout === "grid-4"
          ? 4
          : Math.max(1, photoCount);

  if (layout === "horizontal-strip") {
    const slotWidth = (width - margin * 2 - gap * (count - 1)) / count;
    return Array.from({ length: count }, (_, index) => ({
      x: margin + index * (slotWidth + gap),
      y: margin,
      width: slotWidth,
      height: height - margin * 2
    }));
  }

  if (layout === "vertical-strip") {
    const slotHeight = (height - margin * 2 - gap * (count - 1)) / count;
    return Array.from({ length: count }, (_, index) => ({
      x: margin,
      y: margin + index * (slotHeight + gap),
      width: width - margin * 2,
      height: slotHeight
    }));
  }

  const columns = layout === "single" ? 1 : layout === "grid-2" ? 2 : layout === "grid-3" ? 2 : 2;
  const rows = Math.ceil(count / columns);
  const slotWidth = (width - margin * 2 - gap * (columns - 1)) / columns;
  const slotHeight = (height - margin * 2 - gap * (rows - 1)) / rows;
  return Array.from({ length: count }, (_, index) => ({
    x: margin + (index % columns) * (slotWidth + gap),
    y: margin + Math.floor(index / columns) * (slotHeight + gap),
    width: slotWidth,
    height: slotHeight
  }));
}
