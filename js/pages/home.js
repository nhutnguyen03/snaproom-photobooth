import { frames } from "../data/frames.js";
import { renderFramePreview } from "../components/frame-card.js";

const workflowSteps = [
  ["01", "Chọn khung", "Chọn khung Giáng sinh hoặc Tết theo phong cách bạn thích", "Chọn khung ảnh"],
  ["02", "Chụp tư thế", "Hẹn giờ và nhiều ảnh trong một lần", "Chụp ảnh trong giao diện photobooth"],
  ["03", "Tùy chỉnh", "Lọc, cắt và ghép theo cách của bạn", "Tùy chỉnh ảnh và khung"],
  ["04", "Tải về", "Tệp ảnh được xử lý ngay trên thiết bị", "Tải ảnh đã hoàn thiện về thiết bị"]
];

const stepIllustrations = [
  "",
  `<svg viewBox="0 0 420 260" role="img" aria-label="Điện thoại với giao diện chụp ảnh và nút chụp ở giữa"><rect x="132" y="12" width="156" height="236" rx="28" fill="#29252A"/><rect x="143" y="31" width="134" height="198" rx="18" fill="#F2D8D2"/><rect x="151" y="43" width="118" height="145" rx="12" fill="#CFB2A7"/><circle cx="203" cy="99" r="25" fill="#493C3A"/><path d="M167 178c4-37 18-56 36-56s33 19 36 56" fill="#8C5363"/><rect x="174" y="194" width="72" height="6" rx="3" fill="#D6C8CE"/><circle cx="210" cy="213" r="11" fill="#A94761"/><circle cx="210" cy="213" r="7" fill="#FFF9F4"/><path d="M80 76h22m-11-11v22M318 171h22m-11-11v22" stroke="#A94761" stroke-width="3" stroke-linecap="round"/><circle cx="332" cy="77" r="20" fill="#F3E9F6"/><path d="M332 63v28m-14-14h28m-24-10 20 20m0-20-20 20" stroke="#A94761" stroke-width="2" stroke-linecap="round"/></svg>`,
  `<svg viewBox="0 0 420 260" role="img" aria-label="Bảng chỉnh sửa ảnh với thanh điều chỉnh màu sắc"><rect x="54" y="25" width="312" height="210" rx="18" fill="#FFF9F4" stroke="#29252A" stroke-width="2"/><rect x="72" y="44" width="132" height="172" rx="8" fill="#DCC8C8"/><circle cx="136" cy="105" r="24" fill="#493C3A"/><path d="M91 202c5-48 21-71 45-71s40 23 45 71" fill="#A94761"/><rect x="224" y="52" width="118" height="10" rx="5" fill="#E8DCE3"/><rect x="224" y="52" width="70" height="10" rx="5" fill="#A94761"/><circle cx="294" cy="57" r="8" fill="#FFF9F4" stroke="#A94761" stroke-width="3"/><rect x="224" y="91" width="118" height="10" rx="5" fill="#E8DCE3"/><rect x="224" y="91" width="87" height="10" rx="5" fill="#7B8D7D"/><circle cx="311" cy="96" r="8" fill="#FFF9F4" stroke="#7B8D7D" stroke-width="3"/><rect x="224" y="130" width="118" height="10" rx="5" fill="#E8DCE3"/><rect x="224" y="130" width="52" height="10" rx="5" fill="#D9A46F"/><circle cx="276" cy="135" r="8" fill="#FFF9F4" stroke="#D9A46F" stroke-width="3"/><rect x="224" y="174" width="88" height="26" rx="13" fill="#A94761"/><path d="m244 187 6 6 12-13" fill="none" stroke="#FFF9F4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  `<svg viewBox="0 0 420 260" role="img" aria-label="Ảnh photobooth đã hoàn thiện và nút tải về"><rect x="74" y="30" width="154" height="198" rx="5" fill="#FFF9F4" stroke="#29252A" stroke-width="2" transform="rotate(-7 151 129)"/><rect x="93" y="50" width="116" height="139" rx="2" fill="#D9C6C3" transform="rotate(-7 151 119)"/><circle cx="151" cy="101" r="22" fill="#493C3A"/><path d="M109 180c4-41 19-61 42-61s38 20 42 61" fill="#A94761"/><path d="M274 119h74v87h-74z" rx="12" fill="#F3E9F6"/><path d="M311 181v-42m0 0-16 16m16-16 16 16" fill="none" stroke="#A94761" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M288 187v10h46v-10" fill="none" stroke="#A94761" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M279 80h64m-32-14v28" stroke="#D9A46F" stroke-width="3" stroke-linecap="round"/><path d="M76 84H51m12-12v24m275 87h30m-15-15v30" stroke="#A94761" stroke-width="3" stroke-linecap="round"/></svg>`
];

function createArrowIcon(direction) {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", direction === "left" ? "M15 5 8 12l7 7" : "m9 5 7 7-7 7");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "1.8");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  icon.append(path);
  return icon;
}

function createFrameShowcase() {
  const section = document.createElement("section");
  section.className = "home-frame-showcase";
  section.setAttribute("aria-labelledby", "home-frames-title");

  const heading = document.createElement("div");
  heading.className = "home-section-heading";
  const headingCopy = document.createElement("div");
  const eyebrow = document.createElement("p");
  eyebrow.className = "technical-label";
  eyebrow.textContent = "20 KHUNG / GIÁNG SINH & TẾT";
  const title = document.createElement("h2");
  title.id = "home-frames-title";
  title.textContent = "Chọn khung cho câu chuyện của bạn.";
  headingCopy.append(eyebrow, title);

  const headingActions = document.createElement("div");
  headingActions.className = "home-reel-actions";
  const controls = document.createElement("div");
  controls.className = "home-reel-controls";
  const trackId = "home-frame-track";
  for (const direction of ["left", "right"]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "home-reel-control";
    button.setAttribute("aria-label", direction === "left" ? "Xem khung trước" : "Xem thêm khung");
    button.setAttribute("aria-controls", trackId);
    button.append(createArrowIcon(direction));
    button.addEventListener("click", () => {
      const track = section.querySelector(".home-frame-track");
      track.scrollBy({ left: (direction === "left" ? -1 : 1) * track.clientWidth * 0.8, behavior: "smooth" });
    });
    controls.append(button);
  }
  const allFrames = document.createElement("a");
  allFrames.className = "home-view-all";
  allFrames.href = "#/frames";
  allFrames.textContent = "Xem tất cả";
  headingActions.append(controls, allFrames);
  heading.append(headingCopy, headingActions);

  const track = document.createElement("div");
  track.className = "home-frame-track";
  track.id = trackId;
  track.tabIndex = 0;
  track.setAttribute("role", "region");
  track.setAttribute("aria-label", "Vuốt ngang để xem các khung ảnh");

  for (const [index, frame] of frames.entries()) {
    const card = document.createElement("article");
    card.className = `home-frame-card frame-card--${frame.layout}${frame.category === "Giáng sinh" ? " frame-card--christmas" : " frame-card--lunar-new-year"}`;
    const preview = renderFramePreview(frame, index);
    preview.setAttribute("aria-hidden", "true");
    const info = document.createElement("div");
    info.className = "home-frame-card-info";
    const name = document.createElement("h3");
    name.textContent = frame.name;
    const meta = document.createElement("p");
    meta.textContent = `${frame.category} · 1–4 ảnh`;
    const choose = document.createElement("button");
    choose.type = "button";
    choose.className = "home-frame-select";
    choose.textContent = "Chọn khung";
    choose.setAttribute("aria-label", `Chọn khung ${frame.name}`);
    choose.addEventListener("click", () => {
      localStorage.setItem("snaproom-selected-frame", frame.id);
      location.hash = "#/booth";
    });
    info.append(name, meta, choose);
    card.append(preview, info);
    track.append(card);
  }

  section.append(heading, track);
  return section;
}

function createWorkflow() {
  const section = document.createElement("section");
  section.className = "home-workflow";
  section.setAttribute("aria-labelledby", "home-workflow-title");

  const heading = document.createElement("div");
  heading.className = "home-workflow-heading";
  const label = document.createElement("p");
  label.className = "technical-label";
  label.textContent = "SNAPROOM / 4 BƯỚC";
  const title = document.createElement("h2");
  title.id = "home-workflow-title";
  title.textContent = "Từ khoảnh khắc đến tấm ảnh.";
  heading.append(label, title);

  const list = document.createElement("div");
  list.className = "home-step-list";
  const buttons = [];
  const panels = [];

  workflowSteps.forEach(([numberText, labelText, description, illustrationLabel], index) => {
    const item = document.createElement("article");
    item.className = "home-step";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "home-step-button";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", `home-step-panel-${index + 1}`);

    const number = document.createElement("span");
    number.className = "home-step-number technical-label";
    number.textContent = numberText;
    const copy = document.createElement("span");
    copy.className = "home-step-copy";
    const stepTitle = document.createElement("span");
    stepTitle.className = "home-step-title";
    stepTitle.textContent = labelText;
    const stepDescription = document.createElement("span");
    stepDescription.className = "home-step-description";
    stepDescription.textContent = description;
    copy.append(stepTitle, stepDescription);
    const chevron = createArrowIcon("right");
    chevron.classList.add("home-step-chevron");
    button.append(number, copy, chevron);

    const panel = document.createElement("div");
    panel.className = "home-step-panel";
    panel.id = `home-step-panel-${index + 1}`;
    panel.hidden = true;
    const visual = document.createElement("div");
    visual.className = `home-step-visual home-step-visual--${index + 1}`;
    if (index === 0) {
      visual.setAttribute("role", "img");
      visual.setAttribute("aria-label", illustrationLabel);
      const preview = renderFramePreview(frames[0], 0);
      preview.setAttribute("aria-hidden", "true");
      visual.append(preview);
    } else {
      visual.innerHTML = stepIllustrations[index];
    }
    const panelCopy = document.createElement("p");
    panelCopy.textContent = illustrationLabel;
    panel.append(visual, panelCopy);
    item.append(button, panel);
    list.append(item);
    buttons.push(button);
    panels.push(panel);
  });

  let activeStep = null;
  let transitionId = 0;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const closeDuration = reducedMotion ? 0 : 340;

  async function selectStep(index) {
    const currentTransition = ++transitionId;
    const previousStep = activeStep;
    if (previousStep === index) {
      activeStep = null;
      buttons[index].setAttribute("aria-expanded", "false");
      panels[index].classList.remove("is-open");
      window.setTimeout(() => {
        panels[index].hidden = true;
      }, closeDuration);
      return;
    }

    activeStep = null;
    if (previousStep !== null) {
      buttons[previousStep].setAttribute("aria-expanded", "false");
      panels[previousStep].classList.remove("is-open");
      await new Promise((resolve) => window.setTimeout(resolve, closeDuration));
      panels[previousStep].hidden = true;
    }
    if (currentTransition !== transitionId) return;

    activeStep = index;
    buttons[index].setAttribute("aria-expanded", "true");
    panels[index].hidden = false;
    window.requestAnimationFrame(() => {
      if (currentTransition === transitionId) panels[index].classList.add("is-open");
    });
  }

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => selectStep(index));
  });

  section.append(heading, list);
  return section;
}

export function renderHome() {
  const page = document.createElement("div");
  page.className = "home-page";

  const hero = document.createElement("section");
  hero.className = "home-hero";
  hero.setAttribute("aria-labelledby", "home-title");

  const copy = document.createElement("div");
  copy.className = "home-hero-copy";

  const issue = document.createElement("p");
  issue.className = "technical-label";
  issue.textContent = "SNAPROOM № 004 — phiên bản riêng";

  const title = document.createElement("h1");
  title.id = "home-title";
  const lineOne = document.createTextNode("Khoảnh khắc ");
  const lineTwo = document.createElement("em");
  lineTwo.textContent = "in trên giấy.";
  title.append(lineOne, lineTwo);

  const brandLine = document.createElement("p");
  brandLine.className = "home-brandline";
  brandLine.textContent = "Your moments. Your frames. Your story.";

  const vietnameseLine = document.createElement("p");
  vietnameseLine.className = "home-description";
  vietnameseLine.textContent = "Giữ lại những khoảnh khắc nhỏ theo cách thật riêng của bạn.";

  const actions = document.createElement("div");
  actions.className = "home-actions";
  const boothLink = document.createElement("a");
  boothLink.className = "button button-primary";
  boothLink.href = "#/booth";
  boothLink.textContent = "Chụp ngay";
  const framesLink = document.createElement("a");
  framesLink.className = "button button-secondary";
  framesLink.href = "#/frames";
  framesLink.textContent = "Xem khung";
  actions.append(boothLink, framesLink);

  copy.append(issue, title, brandLine, vietnameseLine, actions);

  const art = document.createElement("div");
  art.className = "home-art";
  art.setAttribute("aria-label", "Minh họa một dải ảnh SNAPROOM");

  const sheet = document.createElement("div");
  sheet.className = "hero-sheet";
  const sheetLabel = document.createElement("span");
  sheetLabel.className = "hero-sheet-label";
  sheetLabel.textContent = "SHEET 004";
  for (let index = 0; index < 4; index += 1) {
    const shot = document.createElement("div");
    shot.className = "hero-shot";
    sheet.append(shot);
  }
  sheet.append(sheetLabel);

  const stamp = document.createElement("p");
  stamp.className = "hero-stamp";
  stamp.textContent = "ĐÃ LƯU";
  art.append(sheet, stamp);

  hero.append(copy, art);

  const privacy = document.createElement("section");
  privacy.className = "home-privacy";
  privacy.setAttribute("aria-labelledby", "privacy-title");
  const privacyLabel = document.createElement("p");
  privacyLabel.className = "technical-label";
  privacyLabel.textContent = "RIÊNG TƯ / LOCAL-FIRST";
  const privacyTitle = document.createElement("h2");
  privacyTitle.id = "privacy-title";
  privacyTitle.textContent = "Ảnh ở lại với bạn.";
  const privacyText = document.createElement("p");
  privacyText.className = "privacy-copy";
  privacyText.textContent = "Ảnh của bạn được xử lý và lưu trực tiếp trên thiết bị. SNAPROOM không tự động tải ảnh lên máy chủ.";
  privacy.append(privacyLabel, privacyTitle, privacyText);

  const finalCta = document.createElement("section");
  finalCta.className = "home-final";
  const finalTitle = document.createElement("h2");
  finalTitle.textContent = "Sẵn sàng lưu hôm nay?";
  const finalLink = document.createElement("a");
  finalLink.className = "button button-primary";
  finalLink.href = "#/booth";
  finalLink.textContent = "Mở photobooth";
  finalCta.append(finalTitle, finalLink);

  page.append(hero, createFrameShowcase(), createWorkflow(), privacy, finalCta);
  return page;
}
