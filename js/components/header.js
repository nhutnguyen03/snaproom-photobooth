const navigationItems = [
  {
    route: "/",
    label: "Trang chủ",
    icon: [
      { tag: "path", d: "M3 10.5 12 3l9 7.5" },
      { tag: "path", d: "M5.5 9.5v11h13v-11" },
      { tag: "path", d: "M9.5 20.5v-6h5v6" }
    ]
  },
  {
    route: "/booth",
    label: "Chụp",
    icon: [
      { tag: "path", d: "M3.5 8.5a2 2 0 0 1 2-2h2l1.5-2h6l1.5 2h2a2 2 0 0 1 2 2v10h-17z" },
      { tag: "circle", cx: "12", cy: "13", r: "3.2" }
    ]
  },
  {
    route: "/frames",
    label: "Khung",
    icon: [
      { tag: "rect", x: "4", y: "4", width: "16", height: "16", rx: "2" },
      { tag: "path", d: "M4 15l4-4 3 3 2-2 7 6" },
      { tag: "circle", cx: "9", cy: "9", r: "1" }
    ]
  },
  {
    route: "/editor",
    label: "Sửa",
    icon: [
      { tag: "path", d: "M4 16.5 15.5 5a2.1 2.1 0 0 1 3 3L7 19.5 3.5 20.5z" },
      { tag: "path", d: "m13.5 7 3.5 3.5" }
    ]
  },
  {
    route: "/gallery",
    label: "Ảnh",
    icon: [
      { tag: "rect", x: "4", y: "5", width: "16", height: "14", rx: "1.5" },
      { tag: "path", d: "m4.5 15 4-4 3.5 3 2.5-2 5 5" },
      { tag: "circle", cx: "9", cy: "9", r: "1" }
    ]
  },
  {
    route: "/settings",
    label: "Cài đặt",
    icon: [
      { tag: "path", d: "M4 7h16M4 17h16" },
      { tag: "circle", cx: "9", cy: "7", r: "2" },
      { tag: "circle", cx: "15", cy: "17", r: "2" }
    ]
  }
];

function createDockIcon(shapes) {
  const namespace = "http://www.w3.org/2000/svg";
  const icon = document.createElementNS(namespace, "svg");
  icon.classList.add("dock-svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("focusable", "false");

  for (const shape of shapes) {
    const element = document.createElementNS(namespace, shape.tag);
    for (const [attribute, value] of Object.entries(shape)) {
      if (attribute !== "tag") element.setAttribute(attribute, value);
    }
    icon.append(element);
  }
  return icon;
}

export function renderHeader() {
  const header = document.createElement("header");
  header.className = "site-header";

  const brand = document.createElement("a");
  brand.className = "brand";
  brand.href = "#/";
  brand.setAttribute("aria-label", "SNAPROOM — Trang chủ");
  brand.textContent = "SNAPROOM";

  header.append(brand);
  return header;
}

export function renderDock(activeRoute) {
  const nav = document.createElement("nav");
  nav.className = "navigation-dock";
  nav.setAttribute("aria-label", "Điều hướng chính");

  for (const item of navigationItems) {
    const link = document.createElement("a");
    link.className = "dock-link";
    link.href = `#${item.route}`;
    link.setAttribute("aria-label", item.label);
    link.title = item.label;
    if (item.route === activeRoute) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }

    const icon = document.createElement("span");
    icon.className = "dock-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.append(createDockIcon(item.icon));
    const text = document.createElement("span");
    text.className = "dock-label";
    text.textContent = item.label;
    link.append(icon, text);
    nav.append(link);
  }
  return nav;
}
