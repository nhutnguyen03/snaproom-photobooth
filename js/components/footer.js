export function renderFooter() {
  const footer = document.createElement("footer");
  footer.className = "site-footer";

  const brand = document.createElement("div");
  brand.className = "footer-brand";

  const name = document.createElement("strong");
  name.textContent = "SNAPROOM";
  const description = document.createElement("p");
  description.textContent = "Khoảnh khắc nhỏ. Theo cách thật riêng của bạn.";

  brand.append(name, description);

  const links = document.createElement("nav");
  links.className = "footer-links";
  links.setAttribute("aria-label", "Liên kết phụ");
  for (const [href, label] of [["#/frames", "Thư viện khung"], ["#/gallery", "Thư viện ảnh"], ["#/settings", "Riêng tư & cài đặt"]]) {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = label;
    links.append(link);
  }

  const privacy = document.createElement("p");
  privacy.className = "footer-privacy";
  privacy.textContent = "Ảnh của bạn được xử lý và lưu trực tiếp trên thiết bị. SNAPROOM không tự động tải ảnh lên máy chủ.";

  const copyright = document.createElement("p");
  copyright.className = "footer-copyright";
  copyright.textContent = `© ${new Date().getFullYear()} SNAPROOM`;

  footer.append(brand, links, privacy, copyright);
  return footer;
}
