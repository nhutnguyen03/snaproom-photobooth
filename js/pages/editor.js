import { frames } from "../data/frames.js";
import { filters } from "../data/filters.js";
import { layouts } from "../core/collage-engine.js";
import { buildCssFilter } from "../core/filter-engine.js";
import { composeFrame, canvasToBlob } from "../core/export-engine.js";
import { getFrameSlots } from "../core/frame-engine.js";
import { getSeasonalFrameSvg } from "../data/seasonal-frame-art.js";
import { getProject, getPhoto, putProject } from "../services/database.js";

export function renderEditor() {
  const page = document.createElement("section");
  page.className = "editor-page";

  const heading = document.createElement("header");
  heading.className = "editor-heading";
  const label = document.createElement("p");
  label.className = "technical-label";
  label.textContent = "EDITOR / creative tools";
  const title = document.createElement("h1");
  title.textContent = "Chỉnh khoảnh khắc.";
  heading.append(label, title);

  const board = document.createElement("div");
  board.className = "editor-board";

  const artRail = document.createElement("aside");
  artRail.className = "editor-art-rail";
  const railLabel = document.createElement("p");
  railLabel.className = "technical-label";
  railLabel.textContent = "Ảnh gốc";
  const photoStrip = document.createElement("div");
  photoStrip.className = "editor-photo-strip";
  artRail.append(railLabel, photoStrip);

  const canvasArea = document.createElement("div");
  canvasArea.className = "editor-canvas-area";
  const canvasStatus = document.createElement("p");
  canvasStatus.className = "editor-status";
  canvasStatus.textContent = "Đang tải dự án…";
  const preview = document.createElement("canvas");
  preview.className = "editor-preview";
  preview.width = 600;
  preview.height = 900;
  canvasArea.append(canvasStatus, preview);

  const tools = document.createElement("aside");
  tools.className = "editor-tools";
  tools.append(createFilterSection(), createAdjustSection(), createLayoutSection(), createFrameSection());

  board.append(artRail, canvasArea, tools);

  const actions = document.createElement("div");
  actions.className = "editor-actions";
  const saveButton = document.createElement("button");
  saveButton.className = "tool-button tool-button-primary";
  saveButton.type = "button";
  saveButton.textContent = "Lưu bản nháp";
  const exportButton = document.createElement("button");
  exportButton.className = "tool-button";
  exportButton.type = "button";
  exportButton.textContent = "Tải ảnh";
  const status = document.createElement("p");
  status.className = "editor-status";
  actions.append(saveButton, exportButton, status);

  page.append(heading, board, actions);

  let project = null;
  let frame = frames[0];
  let photoRecords = [];
  let photoUrls = [];
  let activePhotoIndex = 0;
  let renderTimer = null;
  const state = {
    layout: "frame",
    spacing: 24,
    background: "#FFF9F4",
    borderColor: "#29252A",
    cornerRadius: 0,
    filter: "original",
    adjustments: {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      warmth: 0,
      exposure: 0,
      blur: 0,
      vignette: 0
    },
    photoEdits: []
  };

  async function loadProject() {
    const projectId = localStorage.getItem("snaproom-current-project");
    if (projectId) {
      project = await getProject(projectId);
    }
    if (!project) {
      canvasStatus.textContent = "Bản xem trước mẫu — chụp ảnh để mở bản thật";
      applySavedUi();
      renderDemoPreview();
      saveButton.disabled = false;
      exportButton.disabled = false;
      return;
    }

    frame = frames.find((item) => item.id === project.frameId) || frames[0];
    state.layout = project.layout === frame.layout ? "frame" : project.layout || "frame";
    Object.assign(state, project.editParams || {});
    const records = await Promise.all(project.photoRefs.map((photoId) => getPhoto(photoId)));
    photoRecords = records.filter(Boolean);
    state.photoEdits = Array.isArray(project.photoEdits)
      ? project.photoEdits
      : photoRecords.map(() => ({ zoom: 1, positionX: 50, positionY: 50, rotate: 0, flipX: false, flipY: false, filter: null }));

    for (const url of photoUrls) URL.revokeObjectURL(url);
    photoUrls = [];
    photoStrip.replaceChildren();
    photoRecords.forEach((record, index) => {
      const url = URL.createObjectURL(record.blob);
      photoUrls.push(url);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "editor-photo-thumb";
      button.setAttribute("aria-pressed", String(index === activePhotoIndex));
      const image = document.createElement("img");
      image.src = url;
      image.alt = `Ảnh gốc ${index + 1}`;
      button.append(image);
      button.addEventListener("click", () => {
        activePhotoIndex = index;
        for (const peer of photoStrip.querySelectorAll("button")) peer.setAttribute("aria-pressed", "false");
        button.setAttribute("aria-pressed", "true");
        syncTransformControls();
      });
      photoStrip.append(button);
    });

    applySavedUi();
    canvasStatus.textContent = `${frame.name} · ${frame.exportSize}`;
    scheduleRender();
  }

  function applySavedUi() {
    for (const presetButton of tools.querySelectorAll("[data-filter-id]")) {
      presetButton.classList.toggle("active", presetButton.dataset.filterId === state.filter);
    }
    for (const slider of tools.querySelectorAll("[data-adjustment]")) {
      slider.value = String(state.adjustments[slider.dataset.adjustment] ?? slider.defaultValue);
      updateAdjustmentLabel(slider);
    }
    for (const layoutButton of tools.querySelectorAll("[data-layout]")) {
      layoutButton.classList.toggle("active", layoutButton.dataset.layout === state.layout);
    }
    for (const frameButton of tools.querySelectorAll("[data-frame-id]")) {
      const active = frameButton.dataset.frameId === frame.id;
      frameButton.classList.toggle("active", active);
      frameButton.setAttribute("aria-pressed", String(active));
    }
  }

  function scheduleRender() {
    window.clearTimeout(renderTimer);
    renderTimer = window.setTimeout(renderPreview, 80);
  }

  function renderDemoPreview() {
    preview.width = 420;
    preview.height = Math.round(420 * frame.height / frame.width);
    const context = preview.getContext("2d");
    context.fillStyle = frame.background;
    context.fillRect(0, 0, preview.width, preview.height);

    const palette = ["#CFC5CD", "#E9C7D1", "#A94761", "#D5C9DC"];
    if (frame.layout === "seasonal" && state.layout === "frame") {
      const slots = getFrameSlots(frame, 4);
      slots.forEach((slot, index) => {
        context.fillStyle = palette[index];
        context.fillRect(
          slot.x * preview.width / frame.width,
          slot.y * preview.height / frame.height,
          slot.width * preview.width / frame.width,
          slot.height * preview.height / frame.height
        );
      });

      const previewFrameId = frame.id;
      const art = new Image();
      art.onload = () => {
        if (frame.id === previewFrameId && state.layout === "frame") {
          context.drawImage(art, 0, 0, preview.width, preview.height);
        }
      };
      art.onerror = () => {
        canvasStatus.textContent = "Không thể tải bản xem trước khung.";
      };
      art.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(getSeasonalFrameSvg(frame.id, 4))}`;
      return;
    }

    const gap = state.spacing;
    let slots;
    if (state.layout === "horizontal-strip") {
      const slotWidth = (preview.width - 64 - gap * 3) / 4;
      slots = Array.from({ length: 4 }, (_, index) => ({
        x: 32 + index * (slotWidth + gap),
        y: 32,
        width: slotWidth,
        height: preview.height - 64
      }));
    } else if (state.layout === "grid-2") {
      slots = getDemoGridSlots(2);
    } else if (state.layout === "grid-3") {
      slots = getDemoGridSlots(3);
    } else if (state.layout === "grid-4") {
      slots = getDemoGridSlots(4);
    } else if (state.layout === "single") {
      slots = [{ x: 32, y: 32, width: preview.width - 64, height: preview.height - 64 }];
    } else {
      const slotWidth = preview.width - 64;
      const slotHeight = (preview.height - 64 - gap * 3) / 4;
      slots = Array.from({ length: 4 }, (_, index) => ({
        x: 32,
        y: 32 + index * (slotHeight + gap),
        width: slotWidth,
        height: slotHeight
      }));
    }

    for (let index = 0; index < slots.length; index += 1) {
      const slot = slots[index];
      context.save();
      context.filter = buildCssFilter(state.adjustments);
      context.fillStyle = palette[index];
      context.fillRect(slot.x, slot.y, slot.width, slot.height);
      context.restore();
      context.strokeStyle = state.borderColor;
      context.lineWidth = 2;
      context.strokeRect(slot.x, slot.y, slot.width, slot.height);
    }

    if (frame.layout === "seasonal") {
      const previewFrameId = frame.id;
      const previewLayout = state.layout;
      const frameSlots = slots.map((slot) => ({
        x: slot.x * frame.width / preview.width,
        y: slot.y * frame.height / preview.height,
        width: slot.width * frame.width / preview.width,
        height: slot.height * frame.height / preview.height
      }));
      const art = new Image();
      art.onload = () => {
        if (frame.id === previewFrameId && state.layout === previewLayout) {
          context.drawImage(art, 0, 0, preview.width, preview.height);
        }
      };
      art.onerror = () => {
        canvasStatus.textContent = "Không thể tải bản xem trước khung.";
      };
      art.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(getSeasonalFrameSvg(frame.id, frameSlots.length, frameSlots))}`;
    }

    function getDemoGridSlots(count) {
      const columns = 2;
      const rows = Math.ceil(count / columns);
      const slotWidth = (preview.width - 64 - gap) / columns;
      const slotHeight = (preview.height - 64 - gap * (rows - 1)) / rows;
      return Array.from({ length: count }, (_, index) => ({
        x: 32 + (index % columns) * (slotWidth + gap),
        y: 32 + Math.floor(index / columns) * (slotHeight + gap),
        width: slotWidth,
        height: slotHeight
      }));
    }
  }

  async function renderPreview() {
    if (!photoRecords.length) {
      renderDemoPreview();
      return;
    }
    const blobs = photoRecords.map((record) => record.blob);
    try {
      const canvas = await composeFrame(frame, blobs, {
        layout: state.layout,
        editParams: state.adjustments,
        photoEdits: state.photoEdits,
        spacing: state.spacing,
        borderColor: state.borderColor,
        cornerRadius: state.cornerRadius
      });
      preview.width = 420;
      preview.height = Math.round(420 * frame.height / frame.width);
      preview.getContext("2d").drawImage(canvas, 0, 0, preview.width, preview.height);
    } catch {
      canvasStatus.textContent = "Không thể dựng bản xem trước.";
    }
  }

  function syncTransformControls() {
    const photoEdit = state.photoEdits[activePhotoIndex] || {};
    for (const control of tools.querySelectorAll("[data-photo-edit]")) {
      const key = control.dataset.photoEdit;
      if (control.type === "checkbox") control.checked = Boolean(photoEdit[key]);
      else control.value = String(photoEdit[key] ?? control.defaultValue);
      updateRangeLabel(control);
    }
  }

  function ensurePhotoEdit(index) {
    if (!state.photoEdits[index]) {
      state.photoEdits[index] = {
        zoom: 1,
        positionX: 50,
        positionY: 50,
        rotate: 0,
        flipX: false,
        flipY: false,
        filter: null
      };
    }
  }

  for (const section of tools.querySelectorAll(".editor-section")) {
    section.addEventListener("input", (event) => {
      const slider = event.target.closest("[data-adjustment]");
      if (slider) {
        state.adjustments[slider.dataset.adjustment] = Number(slider.value);
        updateAdjustmentLabel(slider);
        scheduleRender();
      }

      const photoControl = event.target.closest("[data-photo-edit]");
      if (photoControl) {
        ensurePhotoEdit(activePhotoIndex);
        const key = photoControl.dataset.photoEdit;
        state.photoEdits[activePhotoIndex][key] = photoControl.type === "checkbox"
          ? photoControl.checked
          : photoControl.type === "range"
            ? Number(photoControl.value)
            : photoControl.value;
        updateRangeLabel(photoControl);
        scheduleRender();
      }

      const spacingControl = event.target.closest("[data-collage-spacing]");
      if (spacingControl) {
        state.spacing = Number(spacingControl.value);
        updateRangeLabel(spacingControl);
        scheduleRender();
      }

      const cornerControl = event.target.closest("[data-collage-radius]");
      if (cornerControl) {
        state.cornerRadius = Number(cornerControl.value);
        updateRangeLabel(cornerControl);
        scheduleRender();
      }

      const borderControl = event.target.closest("[data-collage-border]");
      if (borderControl) {
        state.borderColor = borderControl.value;
        scheduleRender();
      }
    });
  }

  tools.addEventListener("click", (event) => {
    const filterButton = event.target.closest("[data-filter-id]");
    if (filterButton) {
      state.filter = filterButton.dataset.filterId;
      const preset = filters.find((filter) => filter.id === state.filter);
      state.adjustments = { ...preset.values };
      applySavedUi();
      scheduleRender();
      return;
    }

    const layoutButton = event.target.closest("[data-layout]");
    if (layoutButton) {
      state.layout = layoutButton.dataset.layout;
      applySavedUi();
      scheduleRender();
      return;
    }

    const frameButton = event.target.closest("[data-frame-id]");
    if (frameButton) {
      frame = frames.find((item) => item.id === frameButton.dataset.frameId) || frame;
      state.layout = "frame";
      canvasStatus.textContent = `${frame.name} · ${frame.exportSize}`;
      applySavedUi();
      scheduleRender();
    }
  });

  saveButton.addEventListener("click", async () => {
    if (!project) {
      status.textContent = "Hãy chụp ảnh ở photobooth trước khi lưu dự án.";
      return;
    }
    saveButton.disabled = true;
    status.textContent = "Đang lưu bản nháp…";
    try {
      await putProject({
        ...project,
        frameId: frame.id,
        editParams: { ...state },
        photoEdits: state.photoEdits,
        layout: state.layout,
        updatedAt: Date.now()
      });
      status.textContent = "Đã lưu bản nháp.";
    } catch {
      status.textContent = "Không thể lưu bản nháp.";
    } finally {
      saveButton.disabled = false;
    }
  });

  exportButton.addEventListener("click", async () => {
    if (!photoRecords.length) {
      renderDemoPreview();
      status.textContent = "Đây là bản xem trước. Chụp ảnh để xuất kết quả thật.";
      return;
    }
    exportButton.disabled = true;
    status.textContent = "Đang xuất ảnh…";
    try {
      const canvas = await composeFrame(frame, photoRecords.map((record) => record.blob), {
        layout: state.layout,
        editParams: state.adjustments,
        photoEdits: state.photoEdits,
        spacing: state.spacing,
        borderColor: state.borderColor,
        cornerRadius: state.cornerRadius
      });
      const blob = await canvasToBlob(canvas, "image/jpeg", 0.82);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `snaproom-edit-${Date.now()}.jpg`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      status.textContent = `Đã xuất ${frame.width}×${frame.height}.`;
    } catch {
      status.textContent = "Không thể xuất ảnh.";
    } finally {
      exportButton.disabled = false;
    }
  });

  loadProject().catch(() => {
    canvasStatus.textContent = "Không thể mở dự án.";
  });

  window.addEventListener("hashchange", () => {
    window.clearTimeout(renderTimer);
    for (const url of photoUrls) URL.revokeObjectURL(url);
  }, { once: true });

  return page;
}

function createFilterSection() {
  const section = document.createElement("section");
  section.className = "editor-section";
  const title = document.createElement("h2");
  title.textContent = "Bộ lọc";
  const grid = document.createElement("div");
  grid.className = "filter-grid";
  for (const filter of filters) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.filterId = filter.id;
    button.textContent = filter.name;
    button.style.setProperty("--filter-preview", buildCssFilter(filter.values));
    grid.append(button);
  }
  section.append(title, grid);
  return section;
}

function createAdjustSection() {
  const section = document.createElement("section");
  section.className = "editor-section";
  const title = document.createElement("h2");
  title.textContent = "Điều chỉnh";
  section.append(title);

  const adjustments = [
    ["brightness", "Sáng", 100, 50, 150],
    ["contrast", "Tương phản", 100, 50, 150],
    ["saturation", "Bão hòa", 100, 0, 180],
    ["warmth", "Ấm màu", 0, -40, 40],
    ["exposure", "Phơi sáng", 0, -30, 30],
    ["blur", "Mờ", 0, 0, 12],
    ["vignette", "Vignette", 0, 0, 40]
  ];
  for (const [key, labelText, value, min, max] of adjustments) {
    const row = document.createElement("label");
    row.className = "editor-range";
    row.append(document.createTextNode(labelText));
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.value = String(value);
    input.defaultValue = String(value);
    input.dataset.adjustment = key;
    row.append(input);
    const output = document.createElement("output");
    output.textContent = String(value);
    row.append(output);
    section.append(row);
  }

  const transformTitle = document.createElement("h3");
  transformTitle.textContent = "Ảnh đang chọn";
  section.append(transformTitle);

  for (const [key, labelText, value, min, max] of [
    ["zoom", "Zoom", 1, 1, 2],
    ["positionX", "Ngang", 50, 0, 100],
    ["positionY", "Dọc", 50, 0, 100],
    ["rotate", "Xoay", 0, -45, 45]
  ]) {
    const row = document.createElement("label");
    row.className = "editor-range";
    row.append(document.createTextNode(labelText));
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = key === "zoom" ? "0.05" : "1";
    input.value = String(value);
    input.defaultValue = String(value);
    input.dataset.photoEdit = key;
    row.append(input);
    const output = document.createElement("output");
    output.textContent = String(value);
    row.append(output);
    section.append(row);
  }

  for (const [key, labelText] of [["flipX", "Lật ngang"], ["flipY", "Lật dọc"]]) {
    const label = document.createElement("label");
    label.className = "editor-check";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.photoEdit = key;
    label.append(input, document.createTextNode(labelText));
    section.append(label);
  }
  return section;
}

function createLayoutSection() {
  const section = document.createElement("section");
  section.className = "editor-section";
  const title = document.createElement("h2");
  title.textContent = "Bố cục";
  const grid = document.createElement("div");
  grid.className = "layout-grid";
  for (const layout of layouts) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.layout = layout.id;
    button.textContent = layout.name;
    grid.append(button);
  }
  section.append(title, grid);

  for (const [key, labelText, value, min, max, step] of [
    ["spacing", "Khoảng cách", 24, 0, 80, "1"],
    ["radius", "Bo góc", 0, 0, 80, "1"]
  ]) {
    const row = document.createElement("label");
    row.className = "editor-range";
    row.append(document.createTextNode(labelText));
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = step;
    input.value = String(value);
    input.dataset[key === "spacing" ? "collageSpacing" : "collageRadius"] = "true";
    row.append(input);
    const output = document.createElement("output");
    output.textContent = String(value);
    row.append(output);
    section.append(row);
  }

  const borderRow = document.createElement("label");
  borderRow.className = "editor-check";
  borderRow.append(document.createTextNode("Màu viền"));
  const borderInput = document.createElement("input");
  borderInput.type = "color";
  borderInput.value = "#29252A";
  borderInput.dataset.collageBorder = "true";
  borderRow.append(borderInput);
  section.append(borderRow);
  return section;
}

function createFrameSection() {
  const section = document.createElement("section");
  section.className = "editor-section";
  const title = document.createElement("h2");
  title.textContent = "Khung";
  const grid = document.createElement("div");
  grid.className = "frame-select-grid";
  for (const frame of frames) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.frameId = frame.id;
    button.setAttribute("aria-pressed", "false");
    button.textContent = frame.name;
    grid.append(button);
  }
  section.append(title, grid);
  return section;
}

function updateAdjustmentLabel(input) {
  const output = input.nextElementSibling;
  if (output?.tagName === "OUTPUT") output.textContent = input.value;
}

function updateRangeLabel(input) {
  const output = input.nextElementSibling;
  if (output?.tagName === "OUTPUT") output.textContent = input.value;
}
