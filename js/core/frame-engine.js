import { getSeasonalFrameSlots } from "../data/seasonal-frame-art.js";

export function getFrameSlots(frame, photoCount = frame.slotCount) {
  if (frame.layout === "seasonal") {
    const count = Math.min(4, Math.max(1, Number(photoCount) || frame.slotCount));
    return getSeasonalFrameSlots(frame.id, count);
  }

  if (frame.layout === "strip") {
    const slotHeight = (frame.height - 120) / frame.slotCount;
    return Array.from({ length: frame.slotCount }, (_, index) => ({
      x: 80,
      y: 40 + index * slotHeight,
      width: frame.width - 160,
      height: slotHeight - 20
    }));
  }

  if (frame.layout === "grid" || frame.layout === "rounded-grid") {
    const columns = 2;
    const rows = Math.ceil(frame.slotCount / columns);
    const gap = 36;
    const margin = 72;
    const slotWidth = (frame.width - margin * 2 - gap) / columns;
    const slotHeight = (frame.height - margin * 2 - gap * (rows - 1)) / rows;
    return Array.from({ length: frame.slotCount }, (_, index) => ({
      x: margin + (index % columns) * (slotWidth + gap),
      y: margin + Math.floor(index / columns) * (slotHeight + gap),
      width: slotWidth,
      height: slotHeight
    }));
  }

  if (frame.layout === "contact") {
    const gap = 28;
    const margin = 72;
    const slotWidth = (frame.width - margin * 2 - gap) / 2;
    const slotHeight = (frame.height - margin * 2 - gap * 2) / 3;
    return Array.from({ length: frame.slotCount }, (_, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      return {
        x: margin + column * (slotWidth + gap),
        y: margin + row * (slotHeight + gap),
        width: slotWidth,
        height: slotHeight
      };
    });
  }

  if (frame.layout === "vertical" || frame.layout === "ticket" || frame.layout === "film") {
    const gap = 26;
    const margin = frame.layout === "ticket" ? 90 : 64;
    const slotHeight = (frame.height - margin * 2 - gap * (frame.slotCount - 1)) / frame.slotCount;
    return Array.from({ length: frame.slotCount }, (_, index) => ({
      x: margin,
      y: margin + index * (slotHeight + gap),
      width: frame.width - margin * 2,
      height: slotHeight
    }));
  }

  return [{
    x: 90,
    y: 90,
    width: frame.width - 180,
    height: frame.height - 180
  }];
}
