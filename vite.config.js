import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Đích backend cho dev server. Mặc định trỏ về backend chạy trên máy host
  // (repo core-be: `docker compose up` publish cổng 8000).
  //
  // KHÔNG hardcode tên service docker (vd `backend:8000`) ở đây nữa — tên đó chỉ
  // phân giải được khi vite chạy BÊN TRONG cùng docker network.
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8000'

  const proxyOptions = {
    target: proxyTarget,
    changeOrigin: true,
  }

  return {
    plugins: [react()],
    server: {
      host: true,
      proxy: {
        // Backend expose API ở gốc (vd /auth/login), dashboard gọi qua tiền tố /api.
        '/api': {
          ...proxyOptions,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        // File video/tài nguyên tĩnh do backend phục vụ.
        '/downloads': proxyOptions,
      },
    },
  }
})
