# dashboard-app

Giao diện quản trị (dashboard) cho hệ thống tự động hoá mạng xã hội — repo **frontend độc lập**.

- Stack: **React 19 + Vite + Tailwind CSS 4 + lucide-react**
- Backend nằm ở repo riêng: **[core-be](https://github.com/GiangNguyen0208/core-be)**
- Repo này **không** chứa code backend và **không** cần source backend để build.

---

## Mục lục

- [Quan hệ với repo core-be](#quan-hệ-với-repo-core-be)
- [Chạy dev (khuyến nghị khi phát triển UI)](#chạy-dev-khuyến-nghị-khi-phát-triển-ui)
- [Chạy bằng Docker](#chạy-bằng-docker)
- [Biến môi trường](#biến-môi-trường)
- [Cấu trúc thư mục](#cấu-trúc-thư-dục)
- [Kiểm tra chất lượng](#kiểm-tra-chất-lượng)
- [Ghi chú kiến trúc](#ghi-chú-kiến-trúc)

---

## Quan hệ với repo core-be

Dashboard **không** import hay build bất kỳ thứ gì từ backend. Hai repo chỉ giao tiếp qua HTTP:

1. Toàn bộ lời gọi API dùng đường dẫn **tương đối** `"/api"` (xem `src/features/dashboard/constants.js`).
2. Một tầng proxy chuyển `/api/*` tới backend:
   - **Dev** (`yarn dev`): proxy của Vite, đích lấy từ `VITE_API_PROXY_TARGET`.
   - **Production** (container nginx): `templates/default.conf.template`, đích lấy từ `BACKEND_UPSTREAM`.
3. Tiền tố `/api` bị cắt bỏ trước khi tới backend (backend expose route ở gốc, ví dụ `/auth/login`).
4. Backend phục vụ file video qua `/downloads/`, cũng được proxy tương tự.

Vì đích proxy là **biến môi trường**, cùng một image dashboard có thể trỏ tới bất kỳ backend nào mà không cần build lại.

> **CORS:** khi dashboard gọi backend qua proxy thì trình duyệt thấy cùng origin nên không cần CORS. Nếu bạn gọi thẳng backend từ một origin khác, phải khai báo origin đó trong `CORS_ALLOW_ORIGINS` của repo `core-be`.

---

## Chạy dev (khuyến nghị khi phát triển UI)

Yêu cầu: Node.js 20+ và Yarn 1.22.

```bash
git clone https://github.com/GiangNguyen0208/dashboard-app.git
cd dashboard-app

# copy file mẫu rồi chỉnh nếu backend không chạy ở localhost:8000
cp .env.example .env

yarn install
yarn dev
```

Mở http://localhost:5173.

Vite sẽ proxy `/api` và `/downloads` sang `VITE_API_PROXY_TARGET` (mặc định `http://localhost:8000`). Backend có thể chạy bằng `docker compose up -d` ở repo `core-be` — cổng `8000` được publish ra máy host.

---

## Chạy bằng Docker

```bash
cp .env.example .env      # tuỳ chọn, để override BACKEND_UPSTREAM
docker compose up -d --build
```

Mở http://localhost:5173 (nginx trong container lắng nghe cổng 80, map ra `5173`).

Mặc định `BACKEND_UPSTREAM=http://host.docker.internal:8000`, tức container dashboard gọi ngược ra cổng `8000` đã publish trên máy host — nơi `docker compose` của repo `core-be` đang chạy. Nhờ vậy **hai repo chạy hoàn toàn tách biệt**, không cần chung docker network.

Các cách trỏ backend khác:

| Tình huống | `BACKEND_UPSTREAM` |
|---|---|
| Backend `core-be` chạy cùng máy (mặc định) | `http://host.docker.internal:8000` |
| Backend ở máy khác / domain thật | `https://api.ten-mien-cua-ban.com` |
| Backend chung docker network với dashboard | `http://<tên-service-backend>:8000` |

Build image không cần backend đang chạy — `BACKEND_UPSTREAM` chỉ được áp dụng lúc container khởi động.

---

## Biến môi trường

Tất cả biến được khai báo trong `.env.example`. File `.env` đã được gitignore.

| Biến | Mặc định | Dùng ở | Ý nghĩa |
|---|---|---|---|
| `BACKEND_UPSTREAM` | `http://host.docker.internal:8000` | nginx (container) | Đích proxy `/api/` và `/downloads/` |
| `VITE_API_PROXY_TARGET` | `http://localhost:8000` | Vite dev server | Đích proxy khi chạy `yarn dev` trên máy host |

> Không truyền `host.docker.internal` cho `VITE_API_PROXY_TARGET`: Vite chạy trực tiếp trên máy host, không nằm trong container.

---

## Cấu trúc thư mục

```
dashboard-app/
├── src/
│   ├── features/dashboard/
│   │   ├── api.js           # lớp gọi HTTP (fetch + xử lý session)
│   │   ├── components.jsx   # component UI của dashboard
│   │   ├── constants.js     # API_URL = '/api', hằng số dùng chung
│   │   └── utils.js         # hàm tiện ích/format
│   ├── assets/
│   ├── App.jsx              # khung dashboard + điều phối dữ liệu
│   ├── App.css
│   ├── index.css
│   └── main.jsx             # entry point
├── public/
├── templates/
│   └── default.conf.template  # nginx template, envsubst ${BACKEND_UPSTREAM}
├── .env.example
├── docker-compose.yml
├── Dockerfile               # build Vite -> phục vụ bằng nginx
├── eslint.config.js
├── index.html
├── nginx.conf               # (đã gỡ — thay bằng templates/)
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── yarn.lock                # BẮT BUỘC commit (Dockerfile dùng --frozen-lockfile)
```

---

## Kiểm tra chất lượng

Chạy từ thư mục gốc repo:

```bash
yarn lint     # eslint
yarn build    # build production vào dist/
yarn preview  # xem thử bản build
```

CI (`.github/workflows/ci.yml`) chạy `yarn install --frozen-lockfile`, `yarn lint`, `yarn build` trên mỗi push/PR.

---

## Ghi chú kiến trúc

- **Không hardcode tên service docker** (kiểu `http://backend:8000`) trong `vite.config.js` hay `nginx.conf`. Tên đó chỉ phân giải được khi container nằm chung docker network, sẽ hỏng khi chạy dev hoặc deploy tách rời.
- **`yarn.lock` phải được commit.** Dockerfile dùng `yarn install --frozen-lockfile`; thiếu lockfile thì build sẽ lỗi.
- Cấu hình nginx là **template** (`templates/default.conf.template`) chứ không phải file tĩnh. Entrypoint của image nginx chính thức chạy `envsubst` để thay `${BACKEND_UPSTREAM}` rồi ghi ra `/etc/nginx/conf.d/default.conf`.
- Biến nội bộ của nginx (`$host`, `$uri`, `$proxy_host`…) không bị `envsubst` thay vì chúng không tồn tại trong môi trường container.
