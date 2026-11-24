# SNAPROOM — Photobooth

SNAPROOM là ứng dụng photobooth chạy trực tiếp trên trình duyệt, giúp chụp, trang trí và lưu ảnh theo phong cách riêng. Phiên bản **1.0.0** tập trung vào trải nghiệm local-first: ảnh và dự án được xử lý, lưu trên thiết bị của người dùng, không cần tài khoản hay máy chủ ứng dụng.

## Tính năng

- **Chụp ảnh:** chọn camera, tỷ lệ ảnh, số ảnh và thời gian đếm ngược; chụp lại từng ảnh hoặc cả phiên.
- **Khung ảnh:** thư viện khung nhiều chủ đề, bao gồm 10 khung Giáng sinh và 10 khung Tết Nguyên Đán.
- **Chỉnh sửa:** bộ lọc, điều chỉnh ảnh, biến đổi vị trí/kích thước, bố cục và xuất ảnh.
- **Thư viện:** tìm kiếm, sắp xếp, xem dạng lưới hoặc editorial, tải ảnh, mở lại trong editor và xóa dự án có xác nhận.
- **Cài đặt:** tùy chỉnh camera và định dạng xuất; xem dung lượng; sao lưu và khôi phục dữ liệu.
- **Responsive:** giao diện thích ứng với máy tính, máy tính bảng và điện thoại; chế độ chụp toàn màn hình.
- **PWA:** có web app manifest, biểu tượng và service worker cho môi trường HTTPS.

## Bắt đầu

Đây là ứng dụng web tĩnh, không cần cài package hay chạy bước build.

1. Mở thư mục dự án trong VS Code.
2. Chạy bằng tiện ích **Live Server** (hoặc một static HTTP server).
3. Mở địa chỉ local server hiển thị, ví dụ `http://localhost:5500/`.

## Triển khai lên Vercel

1. Import repository này từ GitHub trong Vercel.
2. Giữ thư mục gốc làm Root Directory và chọn cấu hình static/Other, không cần lệnh cài package hay build.
3. Deploy các file trong repository root.

Ứng dụng dùng hash route (`#/...`), vì vậy không cần cấu hình rewrite route. Vercel cung cấp HTTPS để trình duyệt có thể yêu cầu quyền camera.

Có thể mở các màn hình trực tiếp bằng hash route:

| Màn hình | Route |
| --- | --- |
| Trang chủ | `#/` |
| Chụp ảnh | `#/booth` |
| Thư viện khung | `#/frames` |
| Chỉnh sửa | `#/editor` |
| Thư viện ảnh | `#/gallery` |
| Cài đặt | `#/settings` |

### Quyền camera

Trình duyệt chỉ cho phép camera trong secure context như `localhost` hoặc HTTPS. Khi chạy trên điện thoại, hãy triển khai qua HTTPS; địa chỉ LAN HTTP thông thường không được phép truy cập camera. Lần đầu sử dụng, hãy cấp quyền camera cho trang web.

## Dữ liệu và quyền riêng tư

- Ảnh và dự án được lưu trong IndexedDB của trình duyệt; một số tùy chọn được lưu trong local storage.
- Ứng dụng không tự động tải ảnh lên máy chủ.
- Dữ liệu trình duyệt có thể mất khi người dùng xóa dữ liệu trang web hoặc đổi thiết bị. Hãy dùng chức năng **Sao lưu** để lưu bản backup ở nơi an toàn.
- SNAPROOM không chứa backend, tài khoản người dùng hay dịch vụ phân tích từ xa.

## Công nghệ

- HTML, CSS và JavaScript ES modules thuần.
- Canvas để xử lý và xuất ảnh.
- MediaDevices API để truy cập camera.
- IndexedDB để lưu ảnh và dự án.
- Web App Manifest và Service Worker cho PWA.

Không có `package.json`, toolchain build hoặc test runner trong bản phát hành này; có thể chạy source bằng static server.

## Cấu trúc dự án

```text
assets/
  fonts/          Font local và thông tin giấy phép
  icons/          Biểu tượng ứng dụng SVG
css/              Stylesheet dùng chung và theo từng màn hình
js/
  components/     Header, footer, thẻ khung và điều hướng
  core/           Camera, khung, filter, ghép ảnh, nén và xuất ảnh
  data/           Dữ liệu filter và khung ảnh
  pages/          Các màn hình của ứng dụng
  services/       IndexedDB, cài đặt và PWA
index.html        Điểm vào ứng dụng
manifest.json     Cấu hình cài đặt PWA
service-worker.js Cache app shell cho môi trường production
```

## Font và giấy phép

Font được lưu cục bộ trong `assets/fonts/`, không tải từ CDN. Các font Fraunces, Be Vietnam Pro và JetBrains Mono được phân phối theo SIL Open Font License 1.1; xem `assets/fonts/OFL.txt` và `assets/fonts/README.md`.

Mã nguồn SNAPROOM được phát hành theo MIT License (xem `LICENSE`). Giấy phép của các font đi kèm được áp dụng riêng.

## Phát hành

**SNAPROOM 1.0.0** — bản phát hành đầu tiên hoàn thiện luồng chụp ảnh, thư viện khung, chỉnh sửa, quản lý dự án, cài đặt, sao lưu/khôi phục và giao diện responsive.
