import { frames } from "../data/frames.js";
import { CameraEngine, getCameraErrorMessage } from "../core/camera-engine.js";
import { compressImageBlob, createThumbnail, preferredCaptureMime } from "../core/compression-engine.js";
import { composeFrame, canvasToBlob as exportToBlob } from "../core/export-engine.js";
import { getSettings, saveSettings } from "../services/settings-service.js";
import { putPhoto, putProject } from "../services/database.js";
import { getSeasonalFrameSvg } from "../data/seasonal-frame-art.js";

export function renderBooth() {
  const settings = getSettings();
  const selectedFrameId = localStorage.getItem("snaproom-selected-frame");
  let selectedFrame = frames.find((frame) => frame.id === selectedFrameId) || frames[0];

  const page = document.createElement("section");
  page.className = "booth-page";

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
  fullscreenLabel.className = "sr-only";
  fullscreenLabel.textContent = "Toàn màn hình";
  fullscreenToggle.append(fullscreenIcon, fullscreenLabel);

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
  const frameOverlay = document.createElement("img");
  frameOverlay.className = "camera-frame-overlay";
  frameOverlay.alt = "";
  frameOverlay.setAttribute("aria-hidden", "true");
  const countdown = document.createElement("p");
  countdown.className = "countdown";
  countdown.setAttribute("aria-live", "assertive");

  const stageStatus = document.createElement("p");
  stageStatus.className = "camera-status";
  stageStatus.textContent = "Camera chưa bật.";
  stageStatus.setAttribute("role", "status");
  stageStatus.setAttribute("aria-live", "polite");
  const cameraOverlay = document.createElement("div");
  cameraOverlay.className = "camera-overlay-controls";
  cameraOverlay.setAttribute("aria-label", "Điều khiển camera");
  const startButton = createCameraIconButton(
    "Bật camera",
    "M4 7h4l2-3h4l2 3h4v13H4zM12 10a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
  );
  startButton.classList.add("camera-start-button");
  const switchButton = createCameraIconButton(
    "Đổi camera trước/sau",
    "M20 7h-5l2-2m-2 2 2 2M4 17h5l-2 2m2-2-2-2M5 8a7 7 0 0 1 11-2m3 10a7 7 0 0 1-11 2"
  );
  switchButton.disabled = true;
  const torchButton = createCameraIconButton(
    "Bật đèn",
    "M13 2 5 13h6l-1 9 9-12h-6l1-8Z"
  );
  torchButton.disabled = true;
  const aspectValues = ["1:1", "4:5", "3:4", "2:3", "9:16", "16:9"];
  const aspectButton = createAspectButton();
  const aspectShape = aspectButton.querySelector("rect");
  cameraOverlay.append(startButton, switchButton, torchButton, aspectButton);
  stage.append(videoShell);
  videoShell.append(video, frameOverlay, cropGuide, countdown, stageStatus);

  const tools = document.createElement("aside");
  tools.className = "booth-tools";
  tools.id = "booth-tools-panel";

  const cameraDeviceSelect = document.createElement("select");
  cameraDeviceSelect.id = "booth-camera-device";
  cameraDeviceSelect.setAttribute("aria-label", "Chọn nguồn camera");
  cameraDeviceSelect.disabled = true;
  const cameraDeviceLabel = document.createElement("label");
  cameraDeviceLabel.className = "control-label camera-device-control";
  cameraDeviceLabel.textContent = "Nguồn camera";
  cameraDeviceLabel.hidden = true;
  cameraDeviceLabel.append(cameraDeviceSelect);
  cameraOverlay.append(cameraDeviceLabel);

  const frameSection = createToolSection("02 / Khung");
  frameSection.classList.add("frame-controls");
  const frameTrack = document.createElement("div");
  frameTrack.className = "booth-frame-track";
  frameTrack.setAttribute("role", "group");
  frameTrack.setAttribute("aria-label", "Chọn khung ảnh");
  for (const frame of frames) {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "booth-frame-option";
    option.dataset.frameId = frame.id;
    option.setAttribute("aria-pressed", String(frame.id === selectedFrame.id));
    option.setAttribute("aria-label", frame.name);
    const image = document.createElement("img");
    image.alt = "";
    image.loading = "lazy";
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(getSeasonalFrameSvg(frame.id, 4))}`;
    const name = document.createElement("span");
    name.textContent = frame.name;
    option.append(image, name);
    frameTrack.append(option);
  }
  frameSection.append(frameTrack);

  const sessionSection = createToolSection("03 / Phiên chụp");
  sessionSection.classList.add("session-controls");
  const shotCountLabel = createSelectControl("Số ảnh", "booth-shot-count", [1, 2, 3, 4, 6, 8], settings.shotCount);
  const countdownLabel = createSelectControl("Đếm ngược", "booth-countdown", [0, 3, 5, 10], settings.countdown);
  const intervalLabel = createSelectControl("Khoảng cách", "booth-interval", [1, 2, 3, 5], settings.interval);
  sessionSection.append(
    createSessionField(shotCountLabel),
    createSessionField(countdownLabel),
    createSessionField(intervalLabel)
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
  actionSection.append(cameraOverlay, captureProgress, captureButton);

  tools.append(frameSection, sessionSection);

  const settingsToggle = document.createElement("button");
  settingsToggle.className = "booth-settings-toggle";
  settingsToggle.type = "button";
  settingsToggle.setAttribute("aria-label", "Thu gọn thông số");
  settingsToggle.setAttribute("aria-expanded", "true");
  settingsToggle.setAttribute("aria-controls", tools.id);
  const settingsIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  settingsIcon.classList.add("booth-settings-icon");
  settingsIcon.setAttribute("viewBox", "0 0 24 24");
  settingsIcon.setAttribute("aria-hidden", "true");
  const settingsIconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  settingsIconPath.setAttribute("d", "M5 15 12 8l7 7");
  settingsIcon.append(settingsIconPath);
  const settingsLabel = document.createElement("span");
  settingsLabel.className = "sr-only";
  settingsLabel.textContent = "Thu gọn thông số";
  settingsToggle.append(settingsIcon, settingsLabel);
  actionSection.append(settingsToggle);

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
  hardware.append(speaker, cameraDot, fullscreenToggle);
  const homeIndicator = document.createElement("div");
  homeIndicator.className = "phone-home-indicator";
  homeIndicator.setAttribute("aria-hidden", "true");
  phone.append(hardware, stage, tools, actionSection, homeIndicator);
  settingsToggle.addEventListener("click", () => {
    const expanded = settingsToggle.getAttribute("aria-expanded") !== "true";
    phone.classList.toggle("settings-collapsed", !expanded);
    settingsToggle.setAttribute("aria-expanded", String(expanded));
    const labelText = expanded ? "Thu gọn thông số" : "Mở thông số";
    settingsToggle.setAttribute("aria-label", labelText);
    settingsLabel.textContent = labelText;
    settingsIconPath.setAttribute("d", expanded ? "M5 15 12 8l7 7" : "M5 9 12 16l7-7");
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
  page.append(board, review);

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
    torchButton.setAttribute("aria-label", "Bật đèn");
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

  function updateAspectButton(aspect) {
    const [widthRatio, heightRatio] = (aspectValues.includes(aspect) ? aspect : aspectValues[0])
      .split(":")
      .map(Number);
    const ratio = widthRatio / heightRatio;
    const width = Math.min(34, 28 * ratio);
    const height = Math.min(28, 34 / ratio);
    aspectShape.setAttribute("x", String((40 - width) / 2));
    aspectShape.setAttribute("y", String((32 - height) / 2));
    aspectShape.setAttribute("width", String(width));
    aspectShape.setAttribute("height", String(height));
    const aspectLabel = aspectButton.querySelector("text");
    aspectLabel.textContent = aspect;
    aspectLabel.setAttribute("font-size", width < 17 ? "5.5" : width < 21 ? "7" : "10");
    aspectButton.setAttribute("aria-label", `Tỷ lệ ${aspect}; nhấn để đổi`);
    aspectButton.title = `Tỷ lệ ${aspect}`;
  }

  function updateFrameOverlay() {
    frameOverlay.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      getSeasonalFrameSvg(selectedFrame.id, Number(shotCountLabel.control.value) || selectedFrame.slotCount)
    )}`;
  }

  function updateSelectedFrame(frame = selectedFrame) {
    selectedFrame = frame || frames[0];
    localStorage.setItem("snaproom-selected-frame", selectedFrame.id);
    for (const option of frameTrack.querySelectorAll("[data-frame-id]")) {
      const active = option.dataset.frameId === selectedFrame.id;
      option.classList.toggle("active", active);
      option.setAttribute("aria-pressed", String(active));
    }

    const shotCountControl = shotCountLabel.control;
    const previousCount = Number(shotCountControl.value) || Number(settings.shotCount);
    shotCountControl.replaceChildren();
    const availableCounts = [];
    for (const value of [1, 2, 3, 4, 6, 8]) {
      if (value > selectedFrame.slotCount) continue;
      availableCounts.push(value);
      const option = document.createElement("option");
      option.value = String(value);
      option.textContent = value === 1 ? "1 ảnh" : `${value} ảnh`;
      shotCountControl.append(option);
    }
    shotCountControl.value = String(
      availableCounts.includes(previousCount) ? previousCount : selectedFrame.slotCount
    );
    settings.shotCount = Number(shotCountControl.value);
    saveSettings(settings);
    updateFrameOverlay();
  }

  frameTrack.addEventListener("click", (event) => {
    const option = event.target.closest("[data-frame-id]");
    if (!option) return;
    const frame = frames.find((item) => item.id === option.dataset.frameId);
    if (frame) updateSelectedFrame(frame);
  });
  updateSelectedFrame();

  updateAspectButton(settings.aspect);
  aspectButton.addEventListener("click", () => {
    const currentIndex = aspectValues.indexOf(settings.aspect);
    settings.aspect = aspectValues[(currentIndex + 1 + aspectValues.length) % aspectValues.length];
    setCropAspect(settings.aspect);
    updateAspectButton(settings.aspect);
    saveSettings(settings);
  });
  shotCountLabel.control.addEventListener("change", updateFrameOverlay);

  startButton.addEventListener("click", async () => {
    startButton.disabled = true;
    stageStatus.textContent = "Đang xin quyền camera…";
    try {
      await camera.start({ facingMode: settings.facingMode });
      startButton.classList.add("is-active");
      startButton.setAttribute("aria-label", "Camera đang bật");
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
      startButton.classList.remove("is-active");
      startButton.setAttribute("aria-label", "Bật camera");
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
      torchButton.setAttribute("aria-label", torchEnabled ? "Tắt đèn" : "Bật đèn");
    } catch {
      torchEnabled = false;
      torchButton.classList.remove("active");
      torchButton.setAttribute("aria-label", "Bật đèn");
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
    if (!document.hidden) return;
    camera.stop();
    videoShell.classList.remove("camera-active");
    startButton.classList.remove("is-active");
    startButton.setAttribute("aria-label", "Bật camera");
    startButton.disabled = false;
    switchButton.disabled = true;
    torchButton.disabled = true;
    torchButton.classList.remove("active");
    torchButton.setAttribute("aria-label", "Bật đèn");
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

function createCameraIconButton(label, pathData) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "camera-icon-button";
  button.setAttribute("aria-label", label);
  button.title = label;
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathData);
  icon.append(path);
  button.append(icon);
  return button;
}

function createAspectButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "camera-icon-button aspect-cycle-button";
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 40 32");
  icon.setAttribute("aria-hidden", "true");
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("rx", "1");
  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.setAttribute("x", "20");
  label.setAttribute("y", "16");
  label.textContent = "1:1";
  icon.append(rect, label);
  button.append(icon);
  return button;
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
