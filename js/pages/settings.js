import { getSettings, saveSettings } from "../services/settings-service.js";
import { getAllProjects, getAllPhotos, clearAllData, getPhoto, putPhoto, putProject } from "../services/database.js";
import { createBackup, parseBackup } from "../core/backup-engine.js";

export function renderSettings() {
  const settings = getSettings();
  const page = document.createElement("section");
  page.className = "settings-page";

  const heading = document.createElement("header");
  heading.className = "settings-heading";
  const label = document.createElement("p");
  label.className = "technical-label";
  label.textContent = "SETTINGS / local device";
  const title = document.createElement("h1");
  title.textContent = "Thiết bị của bạn.";
  heading.append(label, title);

  const layout = document.createElement("div");
  layout.className = "settings-layout";
  const nav = document.createElement("nav");
  nav.className = "settings-nav";
  nav.setAttribute("aria-label", "Nhóm cài đặt");

  const main = document.createElement("div");
  main.className = "settings-main";

  const cameraSection = createSection("Camera & chụp");
  cameraSection.append(
    createSelectSetting("Camera mặc định", "camera", [["user", "Camera trước"], ["environment", "Camera sau"]], settings.facingMode),
    createSelectSetting("Tỷ lệ mặc định", "aspect", [["1:1", "1:1"], ["4:5", "4:5"], ["3:4", "3:4"], ["2:3", "2:3"], ["9:16", "9:16"], ["16:9", "16:9"]], settings.aspect),
    createSelectSetting("Đếm ngược", "countdown", [["0", "Tắt"], ["3", "3 giây"], ["5", "5 giây"], ["10", "10 giây"]], String(settings.countdown)),
    createSelectSetting("Số ảnh", "shotCount", [["1", "1 ảnh"], ["2", "2 ảnh"], ["3", "3 ảnh"], ["4", "4 ảnh"], ["6", "6 ảnh"], ["8", "8 ảnh"]], String(settings.shotCount)),
    createCheckboxSetting("Lật gương ảnh selfie khi lưu", "mirrorSave", Boolean(settings.mirrorSave))
  );

  const exportSection = createSection("Xuất ảnh");
  exportSection.append(
    createSelectSetting("Định dạng", "exportFormat", [["image/jpeg", "JPEG"], ["image/png", "PNG"], ["image/webp", "WebP"]], settings.exportFormat),
    createRangeSetting("Chất lượng", "exportQuality", settings.exportQuality * 100, 40, 100)
  );

  const storageSection = createSection("Bộ nhớ thiết bị");
  const storageValue = document.createElement("p");
  storageValue.className = "storage-value";
  storageValue.textContent = "Đang kiểm tra dung lượng…";
  const storageBar = document.createElement("div");
  storageBar.className = "storage-bar";
  const storageUsed = document.createElement("span");
  storageBar.append(storageUsed);
  const storageNote = document.createElement("p");
  storageNote.className = "storage-note";
  storageNote.textContent = "Ảnh và dự án được lưu trong IndexedDB trên thiết bị.";
  storageSection.append(storageValue, storageBar, storageNote);

  const privacySection = createSection("Riêng tư");
  const privacy = document.createElement("p");
  privacy.className = "privacy-copy";
  privacy.textContent = "Ảnh của bạn được xử lý và lưu trực tiếp trên thiết bị. SNAPROOM không tự động tải ảnh lên máy chủ.";
  const persistStatus = document.createElement("p");
  persistStatus.className = "storage-note";
  persistStatus.textContent = "Quyền lưu lâu dài chưa được yêu cầu.";
  const persistButton = document.createElement("button");
  persistButton.type = "button";
  persistButton.className = "settings-button";
  persistButton.textContent = "Yêu cầu lưu lâu dài";
  privacySection.append(privacy, persistStatus, persistButton);

  const backupSection = createSection("Sao lưu & khôi phục");
  const backupCopy = document.createElement("p");
  backupCopy.className = "storage-note";
  backupCopy.textContent = "File sao lưu gồm dữ liệu ảnh blob và manifest dự án. Không yêu cầu máy chủ.";
  const backupButton = document.createElement("button");
  backupButton.type = "button";
  backupButton.className = "settings-button";
  backupButton.textContent = "Tải backup";
  const restoreInput = document.createElement("input");
  restoreInput.type = "file";
  restoreInput.accept = ".snaproom,application/octet-stream";
  restoreInput.id = "backup-file";
  const restoreLabel = document.createElement("label");
  restoreLabel.htmlFor = restoreInput.id;
  restoreLabel.className = "settings-button";
  restoreLabel.textContent = "Chọn file để khôi phục";
  restoreLabel.append(restoreInput);
  const restoreStatus = document.createElement("p");
  restoreStatus.className = "storage-note";
  backupSection.append(backupCopy, backupButton, restoreLabel, restoreStatus);

  const dataSection = createSection("Xóa dữ liệu");
  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "settings-button danger-button";
  clearButton.textContent = "Xóa toàn bộ dữ liệu";
  dataSection.append(clearButton);

  const sectionMap = [
    ["camera", "Camera", cameraSection],
    ["export", "Xuất ảnh", exportSection],
    ["storage", "Bộ nhớ", storageSection],
    ["privacy", "Riêng tư", privacySection],
    ["backup", "Sao lưu", backupSection],
    ["data", "Dữ liệu", dataSection]
  ];

  for (const [id, text, section] of sectionMap) {
    const link = document.createElement("button");
    link.type = "button";
    link.dataset.target = id;
    link.textContent = text;
    link.classList.toggle("active", id === "camera");
    nav.append(link);
    section.dataset.sectionId = id;
  }

  main.append(cameraSection, exportSection, storageSection, privacySection, backupSection, dataSection);
  layout.append(nav, main);
  page.append(heading, layout);

  nav.addEventListener("click", (event) => {
    const button = event.target.closest("[data-target]");
    if (!button) return;
    for (const peer of nav.querySelectorAll("[data-target]")) peer.classList.toggle("active", peer === button);
    const target = main.querySelector(`[data-section-id="${button.dataset.target}"]`);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  for (const input of main.querySelectorAll("[data-setting-key]")) {
    input.addEventListener("change", () => {
      const key = input.dataset.settingKey;
      if (input.type === "checkbox") settings[key] = input.checked;
      else if (input.type === "range") settings[key] = Number(input.value) / 100;
      else if (key === "countdown" || key === "shotCount") settings[key] = Number(input.value);
      else settings[key] = input.value;
      saveSettings(settings);
      if (input.type === "range") {
        input.nextElementSibling.textContent = `${input.value}%`;
      }
    });
  }

  persistButton.addEventListener("click", async () => {
    if (!navigator.storage?.persist) {
      persistStatus.textContent = "Trình duyệt không hỗ trợ yêu cầu lưu lâu dài.";
      return;
    }
    const persisted = await navigator.storage.persist();
    persistStatus.textContent = persisted
      ? "Lưu lâu dài đã được duyệt."
      : "Trình duyệt không duyệt lưu lâu dài.";
  });

  async function updateStorageEstimate() {
    if (!navigator.storage?.estimate) {
      storageValue.textContent = "Không hỗ trợ kiểm tra dung lượng";
      storageUsed.style.width = "0%";
      return;
    }
    try {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 0;
      storageValue.textContent = quota
        ? `${formatBytes(used)} / ${formatBytes(quota)} đã cấp`
        : `${formatBytes(used)} đang dùng`;
      storageUsed.style.width = quota ? `${Math.min(100, (used / quota) * 100)}%` : "0%";
    } catch {
      storageValue.textContent = "Không thể kiểm tra dung lượng";
    }
  }

  backupButton.addEventListener("click", async () => {
    backupButton.disabled = true;
    restoreStatus.textContent = "Đang tạo file sao lưu…";
    try {
      const [projects, photos] = await Promise.all([getAllProjects(), getAllPhotos()]);
      if (!photos.length) {
        restoreStatus.textContent = "Không có ảnh để sao lưu.";
        return;
      }
      const blob = await createBackup(projects, photos);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `snaproom-backup-${Date.now()}.snaproom`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      restoreStatus.textContent = `Đã tạo backup với ${photos.length} ảnh và ${projects.length} dự án.`;
    } catch (error) {
      restoreStatus.textContent = error.message === "QUOTA_EXCEEDED_ERR"
        ? "Thiết bị hết dung lượng."
        : "Không thể tạo backup.";
    } finally {
      backupButton.disabled = false;
    }
  });

  restoreInput.addEventListener("change", async () => {
    const file = restoreInput.files?.[0];
    if (!file) return;
    restoreStatus.textContent = "Đang kiểm tra file…";
    restoreInput.disabled = true;
    try {
      const restored = await parseBackup(file);
      openConfirmDialog(
        "Khôi phục backup?",
        `File chứa ${restored.photos.length} ảnh và ${restored.manifest.projects.length} dự án. Ảnh trùng ID sẽ được giữ nguyên; dự án trùng ID sẽ được ghi đè.`,
        async () => {
          for (const project of restored.manifest.projects) await putProject(project);
          let restoredCount = 0;
          for (const photo of restored.photos) {
            const existing = await getPhoto(photo.id);
            if (existing) continue;
            await putPhoto({
              id: photo.id,
              blob: photo.blob,
              thumbnailBlob: photo.thumbnailBlob || null,
              mime: photo.mime,
              dimensions: photo.dimensions,
              size: photo.blob.size,
              createdAt: photo.createdAt,
              projectId: photo.projectId
            });
            restoredCount += 1;
          }
          restoreStatus.textContent = `Khôi phục ${restoredCount} ảnh mới và các dự án trong file.`;
          await updateStorageEstimate();
        }
      );
    } catch (error) {
      const messages = {
        INVALID_MAGIC: "File không phải backup SNAPROOM.",
        INVALID_MANIFEST: "Manifest backup không hợp lệ.",
        UNSUPPORTED_BACKUP: "Phiên bản backup không được hỗ trợ.",
        MISSING_IMAGES: "Backup thiếu dữ liệu ảnh.",
        ORPHAN_IMAGE: "Backup có ảnh không khớp manifest.",
        INVALID_IMAGE_DATA: "Dữ liệu ảnh bị hỏng.",
        INVALID_IMAGE_LENGTH: "Độ dài dữ liệu ảnh không hợp lệ.",
        INVALID_IMAGE_ID: "Tên ảnh trong backup không hợp lệ."
      };
      restoreStatus.textContent = messages[error.message] || "Không thể đọc file backup.";
    } finally {
      restoreInput.disabled = false;
      restoreInput.value = "";
    }
  });

  clearButton.addEventListener("click", () => {
    openConfirmDialog(
      "Xóa toàn bộ dữ liệu?",
      "Tất cả ảnh và dự án trong IndexedDB sẽ bị xóa. Hãy tải backup trước nếu bạn cần giữ dữ liệu.",
      async () => {
        await clearAllData();
        localStorage.removeItem("snaproom-current-project");
        storageValue.textContent = "0 B";
        storageUsed.style.width = "0%";
        await updateStorageEstimate();
      }
    );
  });

  updateStorageEstimate();
  return page;
}

function createSection(titleText) {
  const section = document.createElement("section");
  section.className = "settings-section";
  const title = document.createElement("h2");
  title.textContent = titleText;
  section.append(title);
  return section;
}

function createSelectSetting(labelText, key, options, selected) {
  const row = document.createElement("label");
  row.className = "settings-row";
  const label = document.createElement("span");
  label.textContent = labelText;
  const select = document.createElement("select");
  select.dataset.settingKey = key;
  for (const [value, text] of options) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = text;
    option.selected = String(value) === String(selected);
    select.append(option);
  }
  row.append(label, select);
  return row;
}

function createCheckboxSetting(labelText, key, checked) {
  const row = document.createElement("label");
  row.className = "settings-check";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.dataset.settingKey = key;
  input.checked = checked;
  row.append(input, document.createTextNode(labelText));
  return row;
}

function createRangeSetting(labelText, key, value, min, max) {
  const row = document.createElement("label");
  row.className = "settings-range";
  const label = document.createElement("span");
  label.textContent = labelText;
  const input = document.createElement("input");
  input.type = "range";
  input.min = String(min);
  input.max = String(max);
  input.value = String(value);
  input.dataset.settingKey = key;
  const output = document.createElement("output");
  output.textContent = `${value}%`;
  row.append(label, input, output);
  return row;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function openConfirmDialog(titleText, descriptionText, onConfirm) {
  const previousFocus = document.activeElement;
  const backdrop = document.createElement("div");
  backdrop.className = "confirm-backdrop";
  const dialog = document.createElement("div");
  dialog.className = "confirm-dialog";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  const title = document.createElement("h2");
  title.textContent = titleText;
  const description = document.createElement("p");
  description.textContent = descriptionText;
  const actions = document.createElement("div");
  actions.className = "confirm-actions";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "Hủy";
  const confirm = document.createElement("button");
  confirm.type = "button";
  confirm.className = "danger-button";
  confirm.textContent = "Xác nhận";
  function close() {
    backdrop.remove();
    document.body.classList.remove("modal-open");
    previousFocus?.focus();
  }
  cancel.addEventListener("click", close);
  confirm.addEventListener("click", async () => {
    confirm.disabled = true;
    try {
      await onConfirm();
      close();
    } catch {
      description.textContent = "Không thể hoàn tất thao tác.";
      confirm.disabled = false;
    }
  });
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) close();
  });
  backdrop.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
  actions.append(cancel, confirm);
  dialog.append(title, description, actions);
  backdrop.append(dialog);
  document.body.append(backdrop);
  document.body.classList.add("modal-open");
  cancel.focus();
}
