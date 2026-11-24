import { getFrameSlots } from "./frame-engine.js";
import { applyCanvasFilter } from "./filter-engine.js";
import { getCollageSlots } from "./collage-engine.js";
import { getSeasonalFrameSvg } from "../data/seasonal-frame-art.js";

export async function composeFrame(frame, photoBlobs, options = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = frame.width;
  canvas.height = frame.height;
  const context = canvas.getContext("2d");
  context.fillStyle = frame.background;
  context.fillRect(0, 0, frame.width, frame.height);

  const layout = options.layout || "frame";
  const slots = layout === "frame"
    ? getFrameSlots(frame, photoBlobs.length || frame.slotCount)
    : getCollageSlots(layout, frame, photoBlobs.length);
  const editParams = options.editParams || {};
  const photoEdits = options.photoEdits || [];
  const spacing = Number(options.spacing ?? 24);
  const borderColor = options.borderColor || "#29252A";
  const cornerRadius = Number(options.cornerRadius || 0);
  const photoSpacing = frame.layout === "seasonal" && layout === "frame" ? 0 : spacing;

  for (let index = 0; index < slots.length; index += 1) {
    if (!photoBlobs[index]) continue;
    const slot = slots[index];
    const bitmap = await createImageBitmap(photoBlobs[index], { imageOrientation: "from-image" });
    const photoEdit = photoEdits[index] || {};
    context.save();
    applyCanvasFilter(context, { ...editParams, ...photoEdit.filter });
    context.beginPath();
    roundedRect(context, slot.x, slot.y, slot.width, slot.height, cornerRadius);
    context.clip();
    drawCover(context, bitmap, {
      ...slot,
      x: slot.x + photoSpacing * 0.5,
      y: slot.y + photoSpacing * 0.5,
      width: slot.width - photoSpacing,
      height: slot.height - photoSpacing
    }, photoEdit);
    context.restore();
    if (frame.layout !== "seasonal") {
      context.strokeStyle = borderColor;
      context.lineWidth = 2;
      context.strokeRect(slot.x, slot.y, slot.width, slot.height);
    }
    bitmap.close();
  }

  if (frame.layout === "seasonal") {
    const frameImage = await loadSvgImage(
      getSeasonalFrameSvg(
        frame.id,
        Math.max(1, Math.min(4, slots.length || frame.slotCount)),
        layout === "frame" ? undefined : slots
      )
    );
    context.drawImage(frameImage, 0, 0, frame.width, frame.height);
  } else {
    drawSeasonalDecoration(context, frame);
  }
  applyWarmthAndVignette(context, editParams, frame);

  if (frame.layout !== "seasonal") {
    context.fillStyle = frame.accent;
    context.fillRect(42, frame.height - 54, 16, 16);
    context.font = `700 ${Math.round(frame.width * 0.018)}px monospace`;
    context.fillStyle = frame.layout === "contact" ? "#F2DDE4" : "#29252A";
    context.fillText(`SNAPROOM № ${frame.id.toUpperCase()}`, 72, frame.height - 38);
  }
  return canvas;
}

function loadSvgImage(svg) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("SEASONAL_FRAME_RENDER_FAILED"));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

function drawSeasonalDecoration(context, frame) {
  if (!frame.decoration) return;
  const scale = Math.max(1, frame.width / 600);
  const margin = 28 * scale;
  const centerY = frame.height / 2;
  const accent = frame.accent;
  const secondary = frame.category === "Giáng sinh" ? "#2C7250" : "#E8B94F";
  context.save();
  context.lineWidth = 3 * scale;
  context.strokeStyle = accent;
  context.fillStyle = accent;

  if (["snow", "stars", "ice"].includes(frame.decoration)) {
    const starCount = frame.decoration === "snow" ? 14 : 9;
    for (let index = 0; index < starCount; index += 1) {
      const x = margin + ((index * 97 * scale) % Math.max(1, frame.width - margin * 2));
      const y = margin + ((index * 173 * scale) % Math.max(1, frame.height - margin * 2));
      drawFourPointStar(context, x, y, (8 + (index % 4) * 3) * scale);
    }
  } else if (["holly", "pine", "wreath"].includes(frame.decoration)) {
    drawBranch(context, margin, margin, 1, 1, secondary, accent, scale);
    drawBranch(context, frame.width - margin, frame.height - margin, -1, -1, secondary, accent, scale);
    if (frame.decoration === "wreath") {
      context.beginPath();
      context.arc(frame.width / 2, centerY, Math.min(frame.width, frame.height) * 0.18, 0, Math.PI * 2);
      context.strokeStyle = secondary;
      context.lineWidth = 12 * scale;
      context.stroke();
      drawBerryCluster(context, frame.width / 2, centerY, accent, scale);
    }
  } else if (frame.decoration === "ornament") {
    [frame.width * .2, frame.width * .5, frame.width * .8].forEach((x, index) => {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, margin * (2 + index % 2));
      context.stroke();
      context.beginPath();
      context.arc(x, margin * (2.5 + index % 2), 20 * scale, 0, Math.PI * 2);
      context.fillStyle = index % 2 ? secondary : accent;
      context.fill();
    });
  } else if (frame.decoration === "candy") {
    for (let y = margin; y < frame.height - margin; y += 84 * scale) {
      context.save();
      context.translate(margin, y);
      context.rotate(-Math.PI / 4);
      context.fillStyle = accent;
      context.fillRect(-16 * scale, 0, 10 * scale, 54 * scale);
      context.restore();
      context.save();
      context.translate(frame.width - margin, y);
      context.rotate(-Math.PI / 4);
      context.fillRect(-16 * scale, 0, 10 * scale, 54 * scale);
      context.restore();
    }
  } else if (frame.decoration === "gift") {
    context.fillStyle = accent;
    context.fillRect(frame.width / 2 - 7 * scale, 0, 14 * scale, frame.height);
    context.fillRect(0, centerY - 7 * scale, frame.width, 14 * scale);
    drawFourPointStar(context, frame.width / 2, centerY, 34 * scale);
  } else if (frame.decoration === "cocoa") {
    context.strokeStyle = accent;
    context.lineWidth = 7 * scale;
    context.beginPath();
    context.arc(frame.width - margin * 2, frame.height - margin * 2, 40 * scale, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(frame.width - margin * 2, frame.height - margin * 2, 58 * scale, -Math.PI / 2, Math.PI / 2);
    context.stroke();
    drawSteam(context, frame.width - margin * 2, frame.height - margin * 2 - 52 * scale, scale);
  } else if (frame.decoration === "peach" || frame.decoration === "apricot") {
    drawBranch(context, margin, frame.height - margin, 1, -1, secondary, accent, scale);
    drawBranch(context, frame.width - margin, margin, -1, 1, secondary, accent, scale);
    for (let index = 0; index < 14; index += 1) {
      const x = margin + ((index * 131 * scale) % Math.max(1, frame.width - margin * 2));
      const y = margin + ((index * 181 * scale) % Math.max(1, frame.height - margin * 2));
      drawBlossom(context, x, y, frame.decoration === "peach" ? "#D88491" : "#E7BB52", scale);
    }
  } else if (frame.decoration === "envelope") {
    context.strokeStyle = secondary;
    context.lineWidth = 8 * scale;
    context.strokeRect(margin, margin, frame.width - 2 * margin, frame.height - 2 * margin);
    drawFourPointStar(context, frame.width / 2, margin * 2, 45 * scale);
  } else if (frame.decoration === "lantern") {
    for (const x of [margin * 2, frame.width - margin * 2]) {
      context.strokeStyle = secondary;
      context.lineWidth = 6 * scale;
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, margin);
      context.stroke();
      context.beginPath();
      context.ellipse(x, margin * 2, 30 * scale, 45 * scale, 0, 0, Math.PI * 2);
      context.stroke();
      context.beginPath();
      context.moveTo(x, margin * 2 + 45 * scale);
      context.lineTo(x, margin * 2 + 70 * scale);
      context.stroke();
    }
  } else if (frame.decoration === "firecracker") {
    for (let index = 0; index < 6; index += 1) {
      const x = margin + index * 36 * scale;
      context.strokeStyle = index % 2 ? secondary : accent;
      context.strokeRect(x, margin, 24 * scale, 70 * scale);
      context.beginPath();
      context.moveTo(x + 12 * scale, margin - 10 * scale);
      context.lineTo(x + 12 * scale, margin);
      context.stroke();
    }
  } else if (frame.decoration === "banh-chung") {
    context.strokeStyle = secondary;
    context.lineWidth = 10 * scale;
    const box = 80 * scale;
    context.strokeRect(frame.width - margin - box, frame.height - margin - box, box, box);
    context.beginPath();
    context.moveTo(frame.width - margin - box, frame.height - margin - box);
    context.lineTo(frame.width - margin, frame.height - margin);
    context.moveTo(frame.width - margin, frame.height - margin - box);
    context.lineTo(frame.width - margin - box, frame.height - margin);
    context.stroke();
  } else if (frame.decoration === "calligraphy") {
    context.strokeStyle = accent;
    context.lineWidth = 8 * scale;
    context.lineCap = "round";
    for (let index = 0; index < 5; index += 1) {
      context.beginPath();
      context.moveTo(frame.width - margin - index * 10 * scale, margin * 2);
      context.quadraticCurveTo(frame.width - margin - 45 * scale, centerY, frame.width - margin - index * 8 * scale, frame.height - margin * 2);
      context.stroke();
    }
  } else if (frame.decoration === "clouds") {
    context.strokeStyle = accent;
    context.lineWidth = 7 * scale;
    for (const y of [margin * 2, frame.height - margin * 2]) {
      for (let x = margin; x < frame.width - margin; x += 110 * scale) {
        context.beginPath();
        context.arc(x, y, 24 * scale, Math.PI, Math.PI * 2);
        context.arc(x + 30 * scale, y, 30 * scale, Math.PI, Math.PI * 2);
        context.stroke();
      }
    }
  } else if (frame.decoration === "citrus") {
    for (let index = 0; index < 8; index += 1) {
      const x = margin + ((index * 109 * scale) % Math.max(1, frame.width - margin * 2));
      const y = margin + ((index * 197 * scale) % Math.max(1, frame.height - margin * 2));
      context.beginPath();
      context.arc(x, y, 16 * scale, 0, Math.PI * 2);
      context.fillStyle = secondary;
      context.fill();
      context.beginPath();
      context.moveTo(x, y - 15 * scale);
      context.lineTo(x + 12 * scale, y - 26 * scale);
      context.stroke();
    }
  } else if (frame.decoration === "fan") {
    const x = frame.width / 2;
    const y = frame.height - margin;
    context.strokeStyle = accent;
    context.lineWidth = 5 * scale;
    for (let angle = -Math.PI * .85; angle <= -Math.PI * .15; angle += Math.PI / 12) {
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + Math.cos(angle) * 130 * scale, y + Math.sin(angle) * 130 * scale);
      context.stroke();
    }
    context.beginPath();
    context.arc(x, y, 130 * scale, -Math.PI * .85, -Math.PI * .15);
    context.stroke();
  }

  context.restore();
}

function drawFourPointStar(context, x, y, radius) {
  context.beginPath();
  context.moveTo(x, y - radius);
  context.quadraticCurveTo(x + radius * .18, y - radius * .18, x + radius, y);
  context.quadraticCurveTo(x + radius * .18, y + radius * .18, x, y + radius);
  context.quadraticCurveTo(x - radius * .18, y + radius * .18, x - radius, y);
  context.quadraticCurveTo(x - radius * .18, y - radius * .18, x, y - radius);
  context.fill();
}

function drawBranch(context, x, y, directionX, directionY, leafColor, flowerColor, scale) {
  context.strokeStyle = leafColor;
  context.lineWidth = 6 * scale;
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x + directionX * 100 * scale, y + directionY * 100 * scale);
  context.stroke();
  for (let index = 1; index <= 4; index += 1) {
    const leafX = x + directionX * index * 22 * scale;
    const leafY = y + directionY * index * 22 * scale;
    context.fillStyle = index % 2 ? leafColor : flowerColor;
    context.beginPath();
    context.ellipse(leafX - directionY * 12 * scale, leafY + directionX * 12 * scale, 10 * scale, 5 * scale, Math.PI / 4, 0, Math.PI * 2);
    context.fill();
  }
}

function drawBerryCluster(context, x, y, color, scale) {
  context.fillStyle = color;
  for (const [offsetX, offsetY] of [[0, 0], [18, 4], [8, 18]]) {
    context.beginPath();
    context.arc(x + offsetX * scale, y + offsetY * scale, 9 * scale, 0, Math.PI * 2);
    context.fill();
  }
}

function drawBlossom(context, x, y, color, scale) {
  context.fillStyle = color;
  for (let index = 0; index < 5; index += 1) {
    const angle = index * Math.PI * 2 / 5;
    context.beginPath();
    context.arc(x + Math.cos(angle) * 7 * scale, y + Math.sin(angle) * 7 * scale, 5 * scale, 0, Math.PI * 2);
    context.fill();
  }
  context.fillStyle = "#E8B94F";
  context.beginPath();
  context.arc(x, y, 3 * scale, 0, Math.PI * 2);
  context.fill();
}

function drawSteam(context, x, y, scale) {
  context.strokeStyle = "#FFF9F4";
  context.lineWidth = 4 * scale;
  for (let index = 0; index < 3; index += 1) {
    context.beginPath();
    context.moveTo(x + index * 18 * scale, y);
    context.bezierCurveTo(x - 8 * scale + index * 18 * scale, y - 20 * scale, x + 12 * scale + index * 18 * scale, y - 30 * scale, x + index * 18 * scale, y - 48 * scale);
    context.stroke();
  }
}

function drawCover(context, bitmap, slot, photoEdit = {}) {
  const scale = Math.max(slot.width / bitmap.width, slot.height / bitmap.height);
  const sourceWidth = slot.width / scale;
  const sourceHeight = slot.height / scale;
  const sourceX = (bitmap.width - sourceWidth) / 2;
  const sourceY = (bitmap.height - sourceHeight) / 2;
  const zoom = Math.max(1, Number(photoEdit.zoom || 1));
  const drawWidth = slot.width * zoom;
  const drawHeight = slot.height * zoom;
  const offsetX = (drawWidth - slot.width) * (Number(photoEdit.positionX || 50) / 100);
  const offsetY = (drawHeight - slot.height) * (Number(photoEdit.positionY || 50) / 100);
  context.save();
  context.translate(slot.x + slot.width / 2, slot.y + slot.height / 2);
  context.rotate((Number(photoEdit.rotate || 0) * Math.PI) / 180);
  context.scale(photoEdit.flipX ? -1 : 1, photoEdit.flipY ? -1 : 1);
  context.translate(-slot.x - slot.width / 2 - offsetX, -slot.y - slot.height / 2 - offsetY);
  context.drawImage(
    bitmap,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    slot.x,
    slot.y,
    slot.width,
    slot.height
  );
  context.restore();
}

function roundedRect(context, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}

export function canvasToBlob(canvas, mimeType = "image/jpeg", quality = 0.82) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("EXPORT_FAILED"));
    }, mimeType, quality);
  });
}

function applyWarmthAndVignette(context, values, frame) {
  const warmth = Number(values.warmth) || 0;
  if (warmth > 0) {
    context.save();
    context.globalAlpha = Math.min(0.12, warmth / 250);
    context.fillStyle = "#D99A6C";
    context.fillRect(0, 0, frame.width, frame.height);
    context.restore();
  }

  const vignette = Number(values.vignette) || 0;
  if (vignette > 0) {
    context.save();
    const gradient = context.createRadialGradient(
      frame.width / 2,
      frame.height / 2,
      Math.min(frame.width, frame.height) * 0.2,
      frame.width / 2,
      frame.height / 2,
      Math.max(frame.width, frame.height) * 0.72
    );
    gradient.addColorStop(0, "rgba(41,37,42,0)");
    gradient.addColorStop(1, `rgba(41,37,42,${Math.min(0.72, vignette / 55)})`);
    context.fillStyle = gradient;
    context.fillRect(0, 0, frame.width, frame.height);
    context.restore();
  }
}
