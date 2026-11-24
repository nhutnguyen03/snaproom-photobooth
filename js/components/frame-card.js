import { frames } from "../data/frames.js";
import { getFrameSlots } from "../core/frame-engine.js";
import { getSeasonalFrameSvg } from "../data/seasonal-frame-art.js";

const samplePalettes = [
  ["#8FA9C4", "#E7D3BE", "#4A3B3B", "#3E5068", "#6B4E4E", "#8A5A5A"],
  ["#C9A0A6", "#F3E1C8", "#2F2A34", "#5A4A6B", "#5B4036", "#B07A5B"],
  ["#9CC2A8", "#EFE6C8", "#3B2F2A", "#2F5E4A", "#704A3A", "#D08A47"],
  ["#A7A3D6", "#F1D9E3", "#2A3342", "#4A5A8A", "#6A3F52", "#C26A8A"]
];
const sampleImages = samplePalettes.map((palette) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs><linearGradient id="sample-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${palette[0]}"/><stop offset="1" stop-color="${palette[1]}"/></linearGradient></defs><rect width="600" height="600" fill="url(#sample-bg)"/><circle cx="215" cy="250" r="62" fill="${palette[2]}"/><path d="M80 600C80 460 140 380 215 380S350 460 350 600Z" fill="${palette[3]}"/><circle cx="395" cy="275" r="56" fill="${palette[4]}"/><path d="M270 600C270 480 330 410 395 410S520 480 520 600Z" fill="${palette[5]}"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
});

export function renderFramePreview(frame, sampleOffset = 0) {
  const preview = document.createElement("div");
  preview.className = "frame-preview";
  preview.style.setProperty("--frame-bg", frame.background);
  preview.style.setProperty("--frame-accent", frame.accent);
  if (frame.layout === "seasonal") {
    preview.style.display = "block";
    preview.style.height = "auto";
    preview.style.aspectRatio = `${frame.width} / ${frame.height}`;
    preview.style.padding = "0";
    preview.style.background = "#F5F1E8";

    for (const [index, slot] of getFrameSlots(frame, 4).entries()) {
      const sample = document.createElement("span");
      sample.className = "frame-slot";
      sample.setAttribute("aria-hidden", "true");
      sample.style.position = "absolute";
      sample.style.left = `${(slot.x / frame.width) * 100}%`;
      sample.style.top = `${(slot.y / frame.height) * 100}%`;
      sample.style.width = `${(slot.width / frame.width) * 100}%`;
      sample.style.height = `${(slot.height / frame.height) * 100}%`;
      sample.style.minHeight = "0";
      sample.style.border = "0";
      sample.style.backgroundImage = `url("${sampleImages[(index + sampleOffset) % sampleImages.length]}")`;
      sample.style.backgroundSize = "cover";
      sample.style.backgroundPosition = "center";
      preview.append(sample);
    }

    const art = document.createElement("img");
    art.className = "frame-art";
    art.alt = "";
    art.draggable = false;
    art.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(getSeasonalFrameSvg(frame.id, 4))}`;
    preview.append(art);
  }

  if (frame.decoration) {
    const ornaments = document.createElement("span");
    ornaments.className = "frame-ornaments";
    ornaments.setAttribute("aria-hidden", "true");
    for (let index = 0; index < 3; index += 1) {
      const ornament = document.createElement("i");
      ornaments.append(ornament);
    }
    preview.append(ornaments);
  }

  if (frame.layout !== "seasonal") {
    for (let index = 0; index < frame.slotCount; index += 1) {
      const slot = document.createElement("span");
      slot.className = "frame-slot";
      slot.setAttribute("aria-hidden", "true");
      preview.append(slot);
    }
  }

  if (frame.layout !== "seasonal") {
    const number = document.createElement("span");
    number.className = "frame-number";
    number.textContent = `№ ${String(frames.indexOf(frame) + 1).padStart(3, "0")}`;
    preview.append(number);
  }
  return preview;
}

export function renderFrameCard(frame, isFavorite, onToggleFavorite) {
  const card = document.createElement("article");
  card.className = `frame-card frame-card--${frame.layout}${frame.decoration ? ` frame-card--${frame.decoration}` : ""}`;
  card.dataset.frameId = frame.id;
  if (frame.category === "Giáng sinh" || frame.category === "Tết Nguyên Đán") {
    card.classList.add(frame.category === "Giáng sinh" ? "frame-card--christmas" : "frame-card--lunar-new-year");
  }

  const preview = renderFramePreview(frame);

  const info = document.createElement("div");
  info.className = "frame-card-info";

  const title = document.createElement("h3");
  title.textContent = frame.name;

  const meta = document.createElement("p");
  meta.className = "technical-label";
  meta.textContent = `${frame.category} · ${frame.layout === "seasonal" ? "1–4" : frame.slotCount} ảnh`;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "favorite-button";
  button.setAttribute("aria-pressed", String(isFavorite));
  button.setAttribute("aria-label", `${isFavorite ? "Bỏ yêu thích" : "Thêm yêu thích"} ${frame.name}`);
  button.textContent = isFavorite ? "Đã lưu" : "Lưu khung";
  button.addEventListener("click", () => onToggleFavorite(frame.id));

  info.append(title, meta, button);
  card.append(preview, info);
  return card;
}
