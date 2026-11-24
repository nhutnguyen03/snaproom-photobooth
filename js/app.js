import { startRouter } from "./router.js";
import { renderHeader, renderDock } from "./components/header.js";
import { renderFooter } from "./components/footer.js";
import { renderHome } from "./pages/home.js";
import { renderBooth } from "./pages/booth.js";
import { renderFrames } from "./pages/frames.js";
import { renderEditor } from "./pages/editor.js";
import { renderGallery } from "./pages/gallery.js";
import { renderSettings } from "./pages/settings.js";
import { registerServiceWorker } from "./services/pwa-service.js";

const app = document.querySelector("#app");

function renderRoute(route) {
  const routes = {
    "/": renderHome,
    "/booth": renderBooth,
    "/frames": renderFrames,
    "/editor": renderEditor,
    "/gallery": renderGallery,
    "/settings": renderSettings
  };

  const activeRoute = routes[route] ? route : "/";
  app.replaceChildren();

  const shell = document.createElement("div");
  shell.className = "site-shell";
  shell.append(renderHeader());

  const main = document.createElement("main");
  main.id = "main-content";
  main.className = "main-content";
  main.tabIndex = -1;
  try {
    main.append(routes[activeRoute]());
  } catch (error) {
    console.error(`SNAPROOM route failed: ${activeRoute}`, error);
    main.append(renderRouteError(activeRoute));
  }

  shell.append(main, renderFooter(activeRoute), renderDock(activeRoute));
  app.append(shell);
  document.title = `SNAPROOM — ${getTitle(activeRoute)}`;
}

function renderRouteError(route) {
  const section = document.createElement("section");
  section.className = "route-error";
  const label = document.createElement("p");
  label.className = "technical-label";
  label.textContent = `ROUTE ERROR / ${route}`;
  const title = document.createElement("h1");
  title.textContent = "Trang chưa thể mở.";
  const message = document.createElement("p");
  message.textContent = "Đã xảy ra lỗi khi dựng trang. Hãy tải lại; nếu lỗi còn, mở Developer Tools và gửi nội dung Console để kiểm tra.";
  section.append(label, title, message);
  return section;
}

function getTitle(route) {
  return {
    "/": "Khoảnh khắc của bạn",
    "/booth": "Photobooth",
    "/frames": "Thư viện khung",
    "/editor": "Chỉnh sửa",
    "/gallery": "Thư viện ảnh",
    "/settings": "Cài đặt"
  }[route];
}

startRouter(renderRoute);
registerServiceWorker();
