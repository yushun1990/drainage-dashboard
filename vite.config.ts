import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // 代理天地图API请求以避免cookie冲突
      '/tianditu': {
        target: 'https://api.tianditu.gov.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tianditu/, ''),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('[Proxy] 天地图API代理错误:', err.message)
          })
        }
      }
    }
  }
})
