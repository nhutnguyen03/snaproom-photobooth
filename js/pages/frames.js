import { frames } from "../data/frames.js";
import { renderFrameCard } from "../components/frame-card.js";

export function renderFrames() {
  const page = document.createElement("div");
  page.className = "frames-page";

  const heading = document.createElement("header");
  heading.className = "frames-heading";
  const label = document.createElement("p");
  label.className = "technical-label";
  label.textContent = `FRAME LIBRARY / ${String(frames.length).padStart(2, "0")} mẫu`;
  const title = document.createElement("h1");
  title.textContent = "Chọn dáng in.";
  const count = document.createElement("p");
  count.className = "frames-count";
  count.textContent = `${frames.length} khung gốc`;
  heading.append(label, title, count);

  const toolbar = document.createElement("div");
  toolbar.className = "frames-toolbar";
  const searchLabel = document.createElement("label");
  searchLabel.htmlFor = "frame-search";
  searchLabel.textContent = "Tìm khung";
  const search = document.createElement("input");
  search.id = "frame-search";
  search.type = "search";
  search.placeholder = "Tên hoặc danh mục";

  const categoryLabel = document.createElement("label");
  categoryLabel.htmlFor = "frame-category";
  categoryLabel.textContent = "Danh mục";
  const category = document.createElement("select");
  category.id = "frame-category";

  const categories = ["Tất cả", ...new Set(frames.map((frame) => frame.category))];
  for (const categoryName of categories) {
    const option = document.createElement("option");
    option.value = categoryName;
    option.textContent = categoryName;
    category.append(option);
  }
  toolbar.append(searchLabel, search, categoryLabel, category);

  const grid = document.createElement("div");
  grid.className = "frames-grid";

  let favorites = new Set();
  try {
    const stored = JSON.parse(localStorage.getItem("snaproom-favorites") || "[]");
    if (Array.isArray(stored)) favorites = new Set(stored);
  } catch {
    favorites = new Set();
  }

  let searchTimer = null;

  function updateGrid() {
    const query = search.value.trim().toLocaleLowerCase("vi");
    const selectedCategory = category.value;
    grid.replaceChildren();
    let visibleCount = 0;

    for (const frame of frames) {
      const matchesCategory = selectedCategory === "Tất cả" || frame.category === selectedCategory;
      const matchesQuery = !query ||
        frame.name.toLocaleLowerCase("vi").includes(query) ||
        frame.category.toLocaleLowerCase("vi").includes(query);

      if (matchesCategory && matchesQuery) {
        const card = renderFrameCard(frame, favorites.has(frame.id), (frameId) => {
          if (favorites.has(frameId)) {
            favorites.delete(frameId);
          } else {
            favorites.add(frameId);
          }
          localStorage.setItem("snaproom-favorites", JSON.stringify([...favorites]));
          updateGrid();
        });
        grid.append(card);
        visibleCount += 1;
      }
    }

    if (visibleCount === 0) {
      const empty = document.createElement("p");
      empty.className = "frames-empty";
      empty.textContent = "Không tìm thấy khung phù hợp.";
      grid.append(empty);
    }
  }

  search.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(updateGrid, 180);
  });
  category.addEventListener("change", updateGrid);
  grid.addEventListener("click", (event) => {
    const card = event.target.closest(".frame-card");
    if (!card || event.target.closest(".favorite-button")) return;
    localStorage.setItem("snaproom-selected-frame", card.dataset.frameId);
    window.location.hash = "#/booth";
  });
  updateGrid();

  page.append(heading, toolbar, grid);
  return page;
}
