import { getAllProjects, getAllPhotos, getPhoto, deleteProject, deletePhoto } from "../services/database.js";

export function renderGallery() {
  const page = document.createElement("section");
  page.className = "gallery-page";

  const heading = document.createElement("header");
  heading.className = "gallery-heading";
  const label = document.createElement("p");
  label.className = "technical-label";
  label.textContent = "GALLERY / local archive";
  const title = document.createElement("h1");
  title.textContent = "Khoảnh khắc của bạn.";
  heading.append(label, title);

  const toolbar = document.createElement("div");
  toolbar.className = "gallery-toolbar";
  const searchLabel = document.createElement("label");
  searchLabel.htmlFor = "gallery-search";
  searchLabel.textContent = "Tìm";
  const search = document.createElement("input");
  search.id = "gallery-search";
  search.type = "search";
  search.placeholder = "Tên dự án";

  const sortLabel = document.createElement("label");
  sortLabel.htmlFor = "gallery-sort";
  sortLabel.textContent = "Sắp xếp";
  const sort = document.createElement("select");
  sort.id = "gallery-sort";
  for (const [value, text] of [["newest", "Mới nhất"], ["oldest", "Cũ nhất"], ["name", "Tên"]]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = text;
    sort.append(option);
  }

  const viewLabel = document.createElement("span");
  viewLabel.className = "technical-label";
  viewLabel.textContent = "View";
  const viewButtons = document.createElement("div");
  viewButtons.className = "gallery-view-toggle";
  for (const [view, text] of [["grid", "Lưới"], ["editorial", "Editorial"]]) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.view = view;
    button.textContent = text;
    button.classList.toggle("active", view === "grid");
    viewButtons.append(button);
  }
  toolbar.append(searchLabel, search, sortLabel, sort, viewLabel, viewButtons);

  const status = document.createElement("p");
  status.className = "gallery-status";
  status.textContent = "Đang đọc bộ sưu tập…";
  const grid = document.createElement("div");
  grid.className = "gallery-grid";

  page.append(heading, toolbar, status, grid);

  let projects = [];
  let photos = [];
  let selectedView = "grid";
  let searchTimer = null;
  const objectUrls = [];
  let observer = null;

  async function loadGallery() {
    try {
      [projects, photos] = await Promise.all([getAllProjects(), getAllPhotos()]);
      status.textContent = projects.length
        ? `${projects.length} dự án · ${photos.length} ảnh`
        : "Chưa có dự án trong thiết bị.";
      renderProjects();
    } catch {
      status.textContent = "Không thể mở thư viện trên trình duyệt này.";
    }
  }

  function renderProjects() {
    if (observer) observer.disconnect();
    for (const url of objectUrls) URL.revokeObjectURL(url);
    objectUrls.length = 0;
    grid.className = `gallery-grid gallery-${selectedView}`;
    grid.replaceChildren();

    const query = search.value.trim().toLocaleLowerCase("vi");
    let visible = projects.filter((project) =>
      !query || project.name?.toLocaleLowerCase("vi").includes(query)
    );
    const sortValue = sort.value;
    visible = [...visible].sort((a, b) => {
      if (sortValue === "name") return String(a.name || "").localeCompare(String(b.name || ""), "vi");
      if (sortValue === "oldest") return (a.createdAt || 0) - (b.createdAt || 0);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    if (!visible.length) {
      const empty = document.createElement("div");
      empty.className = "gallery-empty";
      const title = document.createElement("h2");
      title.textContent = "Thư viện đang trống.";
      const text = document.createElement("p");
      text.textContent = "Chụp khoảnh khắc đầu tiên để tạo dự án.";
      const link = document.createElement("a");
      link.className = "button button-primary";
      link.href = "#/booth";
      link.textContent = "Mở photobooth";
      empty.append(title, text, link);
      grid.append(empty);
      return;
    }

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const card = entry.target;
          const image = card.querySelector("img[data-lazy-src]");
          if (image) {
            image.src = image.dataset.lazySrc;
            image.removeAttribute("data-lazy-src");
          }
          observer.unobserve(card);
        });
      }, { rootMargin: "200px" });
    }

    visible.forEach((project, index) => renderProject(project, index));
  }

  function renderProject(project, index) {
    const card = document.createElement("article");
    card.className = "gallery-card";
    card.dataset.projectId = project.id;

    const preview = document.createElement("div");
    preview.className = "gallery-preview";

    const image = document.createElement("img");
    image.alt = project.name || "Dự án SNAPROOM";
    const firstPhoto = photos.find((photo) => project.photoRefs?.includes(photo.id));
    if (firstPhoto?.thumbnailBlob) {
      const url = URL.createObjectURL(firstPhoto.thumbnailBlob);
      objectUrls.push(url);
      image.dataset.lazySrc = url;
    } else if (project.resultBlob) {
      const url = URL.createObjectURL(project.resultBlob);
      objectUrls.push(url);
      image.dataset.lazySrc = url;
    }
    preview.append(image);

    if (index === 0 && selectedView === "editorial") card.classList.add("gallery-card-featured");

    const info = document.createElement("div");
    info.className = "gallery-card-info";
    const title = document.createElement("h2");
    title.text = project.name || "Dự án không tên";
    title.textContent = project.name || "Dự án không tên";
    const meta = document.createElement("p");
    meta.className = "technical-label";
    meta.textContent = `${project.photoRefs?.length || 0} ảnh · ${formatDate(project.createdAt)}`;
    info.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "gallery-card-actions";
    const reopen = document.createElement("button");
    reopen.type = "button";
    reopen.textContent = "Mở editor";
    reopen.addEventListener("click", () => {
      localStorage.setItem("snaproom-current-project", project.id);
      window.location.hash = "#/editor";
    });

    const download = document.createElement("button");
    download.type = "button";
    download.textContent = "Tải";
    download.disabled = !project.resultBlob;
    download.addEventListener("click", () => downloadProject(project));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Xóa";
    deleteButton.addEventListener("click", () => confirmDeleteProject(project));

    actions.append(reopen, download, deleteButton);
    card.append(preview, info, actions);
    grid.append(card);
    if (observer) observer.observe(card);
  }

  async function downloadProject(project) {
    if (!project.resultBlob) return;
    const url = URL.createObjectURL(project.resultBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `snaproom-${project.id}.jpg`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function confirmDeleteProject(project) {
    openConfirmDialog(
      "Xóa dự án?",
      "Dự án và ảnh liên quan sẽ được xóa khỏi thiết bị. Hành động này không thể hoàn tác.",
      async () => {
        for (const photoId of project.photoRefs || []) {
          await deletePhoto(photoId);
        }
        await deleteProject(project.id);
        projects = projects.filter((item) => item.id !== project.id);
        photos = photos.filter((photo) => !(project.photoRefs || []).includes(photo.id));
        status.textContent = "Dự án đã được xóa.";
        renderProjects();
      }
    );
  }

  search.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(renderProjects, 180);
  });
  sort.addEventListener("change", renderProjects);
  viewButtons.addEventListener("click", (event) => {
    const button = event.target.closest("[data-view]");
    if (!button) return;
    selectedView = button.dataset.view;
    for (const peer of viewButtons.querySelectorAll("[data-view]")) {
      peer.classList.toggle("active", peer === button);
    }
    renderProjects();
  });

  window.addEventListener("hashchange", () => {
    if (observer) observer.disconnect();
    window.clearTimeout(searchTimer);
    for (const url of objectUrls) URL.revokeObjectURL(url);
  }, { once: true });

  loadGallery();
  return page;
}

function formatDate(timestamp) {
  if (!timestamp) return "Chưa có ngày";
  return new Date(timestamp).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
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
  confirm.textContent = "Xóa";

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
      description.textContent = "Không thể hoàn tất thao tác xóa.";
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
