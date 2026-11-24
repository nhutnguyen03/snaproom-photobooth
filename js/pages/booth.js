import { frames } from "../data/frames.js";
import { CameraEngine, getCameraErrorMessage } from "../core/camera-engine.js";
import { compressImageBlob, createThumbnail, preferredCaptureMime } from "../core/compression-engine.js";
import { composeFrame, canvasToBlob as exportToBlob } from "../core/export-engine.js";
import { getSettings, saveSettings } from "../services/settings-service.js";
import { putPhoto, putProject } from "../services/database.js";

export function renderBooth() {
  const settings = getSettings();
  const selectedFrameId = localStorage.getItem("snaproom-selected-frame");
  let selectedFrame = frames.find((frame) => frame.id === selectedFrameId) || frames[0];

  const page = document.createElement("section");
  page.className = "booth-page";

  const heading = document.createElement("header");
  heading.className = "booth-heading";
  const label = document.createElement("p");
  label.className = "technical-label";
  label.textContent = "PHOTBOOTH / session";
  const title = document.createElement("h1");
  title.textContent = "Bước vào phòng chụp.";
  const fullscreenToggle = document.createElement("button");
  fullscreenToggle.className = "booth-fullscreen-toggle";
  fullscreenToggle.type = "button";
  fullscreenToggle.setAttribute("aria-label", "Mở giao diện toàn màn hình");
  fullscreenToggle.setAttribute("aria-pressed", "false");
  const fullscreenIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  fullscreenIcon.setAttribute("viewBox", "0 0 24 24");
  fullscreenIcon.setAttribute("aria-hidden", "true");
  const fullscreenIconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  fullscreenIconPath.setAttribute("d", "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5");
  fullscreenIconPath.setAttribute("fill", "none");
  fullscreenIconPath.setAttribute("stroke", "currentColor");
  fullscreenIconPath.setAttribute("stroke-width", "1.8");
  fullscreenIconPath.setAttribute("stroke-linecap", "round");
  fullscreenIconPath.setAttribute("stroke-linejoin", "round");
  fullscreenIcon.append(fullscreenIconPath);
  const fullscreenLabel = document.createElement("span");
  fullscreenLabel.textContent = "Toàn màn hình";
  fullscreenToggle.append(fullscreenIcon, fullscreenLabel);
  heading.append(label, title, fullscreenToggle);

  const board = document.createElement("div");
  board.className = "booth-board";

  const stage = document.createElement("div");
  stage.className = "booth-stage";
  const videoShell = document.createElement("div");
  videoShell.className = "camera-shell";
  const video = document.createElement("video");
  video.className = "camera-video";
  video.playsInline = true;
  video.autoplay = true;
  video.muted = true;
  video.setAttribute("aria-label", "Xem trước camera");
  const cropGuide = document.createElement("div");
  cropGuide.className = "crop-guide";
  const countdown = document.createElement("p");
  countdown.className = "countdown";
  countdown.setAttribute("aria-live", "assertive");

  const stageStatus = document.createElement("p");
  stageStatus.className = "camera-status";
  stageStatus.textContent = "Camera chưa bật.";
  stageStatus.setAttribute("role", "status");
  stageStatus.setAttribute("aria-live", "polite");
  videoShell.append(video, cropGuide, countdown, stageStatus);
  stage.append(videoShell);

  const tools = document.createElement("aside");
  tools.className = "booth-tools";
  tools.id = "booth-tools-panel";

  const cameraSection = createToolSection("01 / Camera");
  cameraSection.classList.add("camera-controls");
  const permissionCopy = document.createElement("p");
  permissionCopy.className = "tool-copy";
  permissionCopy.textContent = "Camera chỉ bật sau khi bạn nhấn nút. Hình ảnh không rời thiết bị.";

  const startButton = document.createElement("button");
  startButton.className = "tool-button tool-button-primary";
  startButton.type = "button";
  startButton.textContent = "Bật camera";

  const cameraRow = document.createElement("div");
  cameraRow.className = "tool-row";
  const switchButton = document.createElement("button");
  switchButton.className = "tool-button";
  switchButton.type = "button";
  switchButton.textContent = "Đổi trước/sau";
  switchButton.disabled = true;
  const torchButton = document.createElement("button");
  torchButton.className = "tool-button";
  torchButton.type = "button";
  torchButton.textContent = "Đèn";
  torchButton.disabled = true;
  cameraRow.append(switchButton, torchButton);

  const cameraDeviceSelect = document.createElement("select");
  cameraDeviceSelect.id = "booth-camera-device";
  cameraDeviceSelect.setAttribute("aria-label", "Chọn nguồn camera");
  cameraDeviceSelect.disabled = true;
  const cameraDeviceLabel = document.createElement("label");
  cameraDeviceLabel.className = "control-label camera-device-control";
  cameraDeviceLabel.textContent = "Nguồn camera";
  cameraDeviceLabel.hidden = true;
  cameraDeviceLabel.append(cameraDeviceSelect);
  cameraSection.append(permissionCopy, startButton, cameraRow, cameraDeviceLabel);

  const frameSection = createToolSection("02 / Khung");
  frameSection.classList.add("frame-controls");
  const frameSelect = document.createElement("select");
  frameSelect.id = "booth-frame";
  frameSelect.setAttribute("aria-label", "Chọn khung");
  for (const frame of frames) {
    const option = document.createElement("option");
    option.value = frame.id;
    option.textContent = `${frame.name} · 1–4 ảnh`;
    option.selected = frame.id === selectedFrame.id;
    frameSelect.append(option);
  }
  frameSection.append(frameSelect);

  const sessionSection = createToolSection("03 / Phiên chụp");
  sessionSection.classList.add("session-controls");
  const shotCountLabel = createSelectControl("Số ảnh", "booth-shot-count", [1, 2, 3, 4, 6, 8], settings.shotCount);
  const countdownLabel = createSelectControl("Đếm ngược", "booth-countdown", [0, 3, 5, 10], settings.countdown);
  const intervalLabel = createSelectControl("Khoảng cách", "booth-interval", [1, 2, 3, 5], settings.interval);
  const aspectLabel = createSegmentedControl("Tỷ lệ", "booth-aspect", ["1:1", "4:5", "3:4", "2:3", "9:16", "16:9"], settings.aspect);
  sessionSection.append(
    createSessionField(shotCountLabel),
    createSessionField(countdownLabel),
    createSessionField(intervalLabel),
    aspectLabel.label,
    aspectLabel.control
  );

  const actionSection = createToolSection("04 / Kết quả");
  actionSection.classList.add("capture-controls");
  const captureButton = document.createElement("button");
  captureButton.className = "tool-button tool-button-primary";
  captureButton.type = "button";
  captureButton.textContent = "Chụp";
  captureButton.setAttribute("aria-label", "Bắt đầu chụp");
  captureButton.disabled = true;
  const captureProgress = document.createElement("p");
  captureProgress.className = "technical-label capture-progress";
  captureProgress.textContent = "0 / 0 ảnh";
  actionSection.append(captureProgress);
  actionSection.append(captureButton);

  tools.append(cameraSection, frameSection, sessionSection);

  const settingsToggle = document.createElement("button");
  settingsToggle.className = "booth-settings-toggle";
  settingsToggle.type = "button";
  settingsToggle.textContent = "Thu gọn thông số";
  settingsToggle.setAttribute("aria-expanded", "true");
  settingsToggle.setAttribute("aria-controls", tools.id);

  const review = document.createElement("section");
  review.className = "booth-review";
  const reviewTitle = document.createElement("h2");
  reviewTitle.textContent = "Ảnh đã chụp";
  const thumbnails = document.createElement("div");
  thumbnails.className = "photo-thumbnails";
  const retakeAllButton = document.createElement("button");
  retakeAllButton.className = "tool-button";
  retakeAllButton.type = "button";
  retakeAllButton.textContent = "Chụp lại tất cả";
  retakeAllButton.disabled = true;
  const saveButton = document.createElement("button");
  saveButton.className = "tool-button tool-button-primary";
  saveButton.type = "button";
  saveButton.textContent = "Ghép & lưu";
  saveButton.disabled = true;
  const reviewActions = document.createElement("div");
  reviewActions.className = "review-actions";
  reviewActions.append(retakeAllButton, saveButton);
  review.append(reviewTitle, thumbnails, reviewActions);

  const phone = document.createElement("div");
  phone.className = "booth-phone";
  const hardware = document.createElement("div");
  hardware.className = "booth-phone-hardware";
  hardware.setAttribute("aria-hidden", "true");
  const speaker = document.createElement("span");
  speaker.className = "phone-speaker";
  const cameraDot = document.createElement("span");
  cameraDot.className = "phone-camera-dot";
  hardware.append(speaker, cameraDot);
  const homeIndicator = document.createElement("div");
  homeIndicator.className = "phone-home-indicator";
  homeIndicator.setAttribute("aria-hidden", "true");
  phone.append(hardware, settingsToggle, stage, tools, actionSection, homeIndicator);
  settingsToggle.addEventListener("click", () => {
    const expanded = settingsToggle.getAttribute("aria-expanded") !== "true";
    phone.classList.toggle("settings-collapsed", !expanded);
    settingsToggle.setAttribute("aria-expanded", String(expanded));
    settingsToggle.textContent = expanded ? "Thu gọn thông số" : "Mở thông số";
  });
  let fallbackFullscreen = false;

  function updateFullscreenToggle() {
    const active = fallbackFullscreen || document.fullscreenElement === page;
    fullscreenToggle.setAttribute("aria-pressed", String(active));
    fullscreenToggle.setAttribute(
      "aria-label",
      active ? "Thoát giao diện toàn màn hình" : "Mở giao diện toàn màn hình"
    );
    fullscreenLabel.textContent = active ? "Thoát toàn màn hình" : "Toàn màn hình";
  }

  function handleFullscreenChange() {
    updateFullscreenToggle();
  }

  page.addEventListener("fullscreenchange", handleFullscreenChange);
  document.addEventListener("fullscreenchange", handleFullscreenChange);
  fullscreenToggle.addEventListener("click", async () => {
    if (fallbackFullscreen) {
      fallbackFullscreen = false;
      page.classList.remove("booth-fullscreen-fallback");
      document.body.classList.remove("booth-fullscreen-fallback");
      updateFullscreenToggle();
      return;
    }

    if (document.fullscreenElement === page) {
      try {
        await document.exitFullscreen();
        updateFullscreenToggle();
      } catch (error) {
        stageStatus.textContent = `Không thể thoát toàn màn hình: ${error.message}`;
      }
      return;
    }

    if (typeof page.requestFullscreen !== "function" || document.fullscreenEnabled === false) {
      fallbackFullscreen = true;
      page.classList.add("booth-fullscreen-fallback");
      document.body.classList.add("booth-fullscreen-fallback");
      stageStatus.textContent = "Trình duyệt không hỗ trợ toàn màn hình; đã mở giao diện mở rộng.";
      updateFullscreenToggle();
      return;
    }

    try {
      await page.requestFullscreen();
      updateFullscreenToggle();
    } catch (error) {
      fallbackFullscreen = true;
      page.classList.add("booth-fullscreen-fallback");
      document.body.classList.add("booth-fullscreen-fallback");
      stageStatus.textContent = `Không thể bật toàn màn hình (${error.message || "trình duyệt từ chối yêu cầu"}); đã mở giao diện mở rộng.`;
      updateFullscreenToggle();
    }
  });
  document.addEventListener("fullscreenchange", handleFullscreenChange);
  board.append(phone);
  page.append(heading, board, review);

  const camera = new CameraEngine(video);
  let captures = [];
  let captureRunId = 0;
  let torchEnabled = false;
  let activeFacingMode = settings.facingMode;
  let activeDeviceId = "";
  let objectUrls = [];

  function setCropAspect(aspect) {
    const ratios = {
      "1:1": "1 / 1",
      "4:5": "4 / 5",
      "3:4": "3 / 4",
      "2:3": "2 / 3",
      "9:16": "9 / 16",
      "16:9": "16 / 9"
    };
    cropGuide.style.aspectRatio = ratios[aspect] || "4 / 5";
  }

  function syncActiveCamera() {
    const track = camera.getVideoTrack();
    const trackSettings = track?.getSettings?.() || {};
    activeDeviceId = trackSettings.deviceId || "";
    activeFacingMode = trackSettings.facingMode || "environment";
    videoShell.classList.toggle("mirror-preview", activeFacingMode === "user");
    const capabilities = track?.getCapabilities?.() || {};
    torchButton.disabled = !("torch" in capabilities);
    torchEnabled = false;
    torchButton.classList.remove("active");
    torchButton.textContent = "Đèn";
    if (activeDeviceId) cameraDeviceSelect.value = activeDeviceId;
  }

  async function refreshCameraDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter((device) => device.kind === "videoinput");
    cameraDeviceSelect.replaceChildren();
    videoInputs.forEach((device, index) => {
      const option = document.createElement("option");
      option.value = device.deviceId;
      option.textContent = device.label || `Camera ${index + 1}`;
      cameraDeviceSelect.append(option);
    });
    cameraDeviceLabel.hidden = videoInputs.length < 2;
    cameraDeviceSelect.disabled = videoInputs.length < 2;
    if (activeDeviceId) cameraDeviceSelect.value = activeDeviceId;
  }

  setCropAspect(settings.aspect);

  function updateSelectedFrame() {
    selectedFrame = frames.find((frame) => frame.id === frameSelect.value) || frames[0];
    localStorage.setItem("snaproom-selected-frame", selectedFrame.id);
    const shotCountControl = shotCountLabel.control;
    shotCountControl.replaceChildren();
    for (const value of [1, 2, 3, 4, 6, 8]) {
      if (value > selectedFrame.slotCount) continue;
      const option = document.createElement("option");
      option.value = String(value);
      option.textContent = value === 1 ? "1 ảnh" : `${value} ảnh`;
      shotCountControl.append(option);
    }
    shotCountControl.value = String(selectedFrame.slotCount);
    settings.shotCount = selectedFrame.slotCount;
    saveSettings(settings);
  }

  frameSelect.addEventListener("change", updateSelectedFrame);
  updateSelectedFrame();

  for (const button of aspectLabel.control.querySelectorAll("button")) {
    button.addEventListener("click", () => {
      for (const peer of aspectLabel.control.querySelectorAll("button")) {
        peer.classList.toggle("active", peer === button);
      }
      setCropAspect(button.dataset.value);
      settings.aspect = button.dataset.value;
      saveSettings(settings);
    });
  }

  startButton.addEventListener("click", async () => {
    startButton.disabled = true;
    stageStatus.textContent = "Đang xin quyền camera…";
    try {
      await camera.start({ facingMode: settings.facingMode });
      startButton.textContent = "Camera đã bật";
      captureButton.disabled = false;
      switchButton.disabled = false;
      stageStatus.textContent = "Camera đã sẵn sàng.";
      videoShell.classList.add("camera-active");
      syncActiveCamera();

      try {
        await refreshCameraDevices();
      } catch (error) {
        stageStatus.textContent = `Camera đã bật, nhưng không thể tải danh sách camera: ${getCameraErrorMessage(error)}`;
      }
    } catch (error) {
      startButton.disabled = false;
      stageStatus.textContent = getCameraErrorMessage(error);
    }
  });

  cameraDeviceSelect.addEventListener("change", async () => {
    cameraDeviceSelect.disabled = true;
    try {
      await camera.selectDevice(cameraDeviceSelect.value);
      syncActiveCamera();
      const selectedCamera = cameraDeviceSelect.selectedOptions[0]?.textContent || "camera đã chọn";
      stageStatus.textContent = `Đang dùng ${selectedCamera}.`;
    } catch (error) {
      if (activeDeviceId) cameraDeviceSelect.value = activeDeviceId;
      stageStatus.textContent = getCameraErrorMessage(error);
    } finally {
      cameraDeviceSelect.disabled = cameraDeviceLabel.hidden;
    }
  });

  switchButton.addEventListener("click", async () => {
    const nextFacing = settings.facingMode === "user" ? "environment" : "user";
    try {
      await camera.switchCamera(nextFacing);
      settings.facingMode = nextFacing;
      saveSettings(settings);
      syncActiveCamera();
      try {
        await refreshCameraDevices();
      } catch (error) {
        stageStatus.textContent = `Đã đổi camera, nhưng không thể tải danh sách: ${getCameraErrorMessage(error)}`;
        return;
      }
      stageStatus.textContent = nextFacing === "user" ? "Đang dùng camera trước." : "Đang dùng camera sau.";
    } catch (error) {
      stageStatus.textContent = getCameraErrorMessage(error);
    }
  });

  torchButton.addEventListener("click", async () => {
    torchEnabled = !torchEnabled;
    try {
      await camera.applyConstraints({ advanced: [{ torch: torchEnabled }] });
      torchButton.classList.toggle("active", torchEnabled);
      torchButton.textContent = torchEnabled ? "Đèn đang bật" : "Đèn";
    } catch {
      torchButton.disabled = true;
      stageStatus.textContent = "Thiết bị không hỗ trợ điều khiển đèn.";
    }
  });

  function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  async function runCountdown(seconds) {
    if (seconds === 0) return;
    countdown.classList.add("visible");
    for (let value = seconds; value > 0; value -= 1) {
      countdown.textContent = String(value);
      await wait(1000);
    }
    countdown.classList.remove("visible");
  }

  function renderThumbnails() {
    for (const url of objectUrls) URL.revokeObjectURL(url);
    objectUrls = [];
    thumbnails.replaceChildren();

    captures.forEach((capture, index) => {
      const item = document.createElement("figure");
      item.className = "photo-thumbnail";
      const url = URL.createObjectURL(capture.thumbBlob);
      objectUrls.push(url);
      const image = document.createElement("img");
      image.src = url;
      image.alt = `Ảnh chụp ${index + 1}`;
      const caption = document.createElement("figcaption");
      const retake = document.createElement("button");
      retake.type = "button";
      retake.textContent = "Chụp lại";
      retake.addEventListener("click", () => retakeOne(index));
      caption.append(document.createTextNode(`${index + 1} / `), retake);
      item.append(image, caption);
      thumbnails.append(item);
    });

    retakeAllButton.disabled = captures.length === 0;
    saveButton.disabled = captures.length === 0;
  }

  async function retakeOne(index) {
    if (!camera.stream) return;
    await runCountdown(Number(countdownLabel.control.value));
    const raw = await captureVideoAsBlob(
      camera.video,
      activeFacingMode === "user" && settings.mirrorSave,
      preferredCaptureMime()
    );
    await replaceCapture(index, raw);
  }

  async function replaceCapture(index, raw) {
    try {
      const compressed = await compressImageBlob(raw, 1600);
      const thumb = await createThumbnail(compressed, 320);
      const compressedBitmap = await createImageBitmap(compressed, { imageOrientation: "from-image" });
      const dimensions = {
        width: compressedBitmap.width,
        height: compressedBitmap.height
      };
      compressedBitmap.close();
      const record = {
        id: crypto.randomUUID(),
        blob: compressed,
        thumbnailBlob: thumb,
        mime: compressed.type,
        dimensions,
        size: compressed.size,
        createdAt: Date.now(),
        projectId: null
      };
      await putPhoto(record);
      captures[index] = record;
      renderThumbnails();
      stageStatus.textContent = `Đã cập nhật ảnh ${index + 1}.`;
    } catch (error) {
      stageStatus.textContent = error.message === "INDEXEDDB_UNAVAILABLE"
        ? "Trình duyệt không hỗ trợ lưu trữ IndexedDB."
        : "Không thể lưu ảnh. Hãy thử lại.";
    }
  }

  captureButton.addEventListener("click", async () => {
    const shotCount = Number(shotCountLabel.control.value);
    const countdownSeconds = Number(countdownLabel.control.value);
    const intervalSeconds = Number(intervalLabel.control.value);
    const runId = ++captureRunId;
    captures = [];
    captureButton.disabled = true;
    switchButton.disabled = true;
    cameraDeviceSelect.disabled = true;

    try {
      for (let index = 0; index < shotCount; index += 1) {
        if (runId !== captureRunId) return;
        await runCountdown(countdownSeconds);
        if (runId !== captureRunId) return;

        const raw = await captureVideoAsBlob(
          camera.video,
          activeFacingMode === "user" && settings.mirrorSave,
          preferredCaptureMime()
        );
        await replaceCapture(index, raw);
        captureProgress.textContent = `${captures.filter(Boolean).length} / ${shotCount} ảnh`;

        if (index < shotCount - 1) await wait(intervalSeconds * 1000);
      }
      stageStatus.textContent = `Đã chụp ${captures.length}/${shotCount} ảnh.`;
      retakeAllButton.disabled = false;
      saveButton.disabled = false;
    } catch (error) {
      stageStatus.textContent = getCameraErrorMessage(error);
    } finally {
      captureButton.disabled = false;
      switchButton.disabled = false;
      cameraDeviceSelect.disabled = cameraDeviceLabel.hidden;
    }
  });

  retakeAllButton.addEventListener("click", async () => {
    captures = [];
    renderThumbnails();
    captureButton.click();
  });

  saveButton.addEventListener("click", async () => {
    saveButton.disabled = true;
    stageStatus.textContent = "Đang ghép khung…";
    try {
      if (navigator.storage?.persist) {
        await navigator.storage.persist();
      }
      updateSelectedFrame();
      const photoBlobs = captures.map((capture) => capture.blob);
      const canvas = await composeFrame(selectedFrame, photoBlobs);
      const resultMime = preferredCaptureMime();
      const resultBlob = await exportToBlob(canvas, resultMime, settings.exportQuality);
      const resultUrl = URL.createObjectURL(resultBlob);
      objectUrls.push(resultUrl);

      const projectId = crypto.randomUUID();
      await putProject({
        id: projectId,
        name: `SNAPROOM ${new Date().toLocaleDateString("vi-VN")}`,
        frameId: selectedFrame.id,
        photoRefs: captures.map((capture) => capture.id),
        resultBlob,
        resultMime,
        editParams: {},
        layout: selectedFrame.layout,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      localStorage.setItem("snaproom-current-project", projectId);

      const link = document.createElement("a");
      link.href = resultUrl;
      link.download = `snaproom-${Date.now()}.${resultMime.includes("png") ? "png" : resultMime.includes("webp") ? "webp" : "jpg"}`;
      link.click();

      stageStatus.textContent = "Đã lưu dự án và tải ảnh ghép.";
      const openEditorButton = document.createElement("button");
      openEditorButton.type = "button";
      openEditorButton.className = "tool-button";
      openEditorButton.textContent = "Mở trong editor";
      openEditorButton.addEventListener("click", () => {
        window.location.hash = "#/editor";
      });
      stageStatus.append(document.createTextNode(" "));
      stageStatus.append(openEditorButton);
    } catch (error) {
      stageStatus.textContent = error.message === "QUOTA_EXCEEDED_ERR"
        ? "Thiết bị hết dung lượng lưu trữ."
        : "Không thể ghép hoặc lưu ảnh.";
    } finally {
      saveButton.disabled = false;
    }
  });

  const cleanup = () => {
    captureRunId += 1;
    camera.stop();
    for (const url of objectUrls) URL.revokeObjectURL(url);
    page.removeEventListener("fullscreenchange", handleFullscreenChange);
    document.removeEventListener("fullscreenchange", handleFullscreenChange);
    page.classList.remove("booth-fullscreen-fallback");
    document.body.classList.remove("booth-fullscreen-fallback");
  };
  window.addEventListener("hashchange", cleanup, { once: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) camera.stop();
  });

  return page;
}

function createToolSection(title) {
  const section = document.createElement("section");
  section.className = "tool-section";
  const heading = document.createElement("h2");
  heading.textContent = title;
  section.append(heading);
  return section;
}

function createSelectControl(labelText, id, values, selectedValue) {
  const label = document.createElement("label");
  label.className = "control-label";
  label.htmlFor = id;
  label.textContent = labelText;
  const control = document.createElement("select");
  control.id = id;
  for (const value of values) {
    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = value === 0 ? "Tắt" : `${value} giây`;
    option.selected = Number(value) === Number(selectedValue);
    control.append(option);
  }
  control.addEventListener("change", () => {
    const settings = getSettings();
    if (id === "booth-shot-count") settings.shotCount = Number(control.value);
    if (id === "booth-countdown") settings.countdown = Number(control.value);
    if (id === "booth-interval") settings.interval = Number(control.value);
    saveSettings(settings);
  });
  return { label, control };
}

function createSessionField(setting) {
  const field = document.createElement("div");
  field.className = "session-field";
  field.append(setting.label, setting.control);
  return field;
}

function createSegmentedControl(labelText, id, values, selectedValue) {
  const label = document.createElement("p");
  label.className = "control-label";
  label.id = `${id}-label`;
  label.textContent = labelText;
  const control = document.createElement("div");
  control.className = "segmented-control";
  control.setAttribute("aria-labelledby", label.id);
  for (const value of values) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.value = value;
    button.textContent = value;
    button.classList.toggle("active", value === selectedValue);
    control.append(button);
  }
  return { label, control };
}

async function captureVideoAsBlob(video, mirror, mimeType) {
  if (!video.videoWidth) throw new Error("CAMERA_NOT_READY");
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext("2d");
  context.save();
  if (mirror) {
    context.translate(canvas.width, 0);
    context.scale(-1, 0);
  }
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  context.restore();
  return await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("IMAGE_ENCODING_FAILED"));
    }, mimeType, 0.82);
  });
}
