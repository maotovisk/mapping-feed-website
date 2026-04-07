import { defineConfig, loadEnv } from 'vite'
import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:5000'
  const devPort = Number(env.VITE_DEV_PORT || '5173')

  return {
    plugins: [
      preact(),
      tailwindcss(),
      {
        name: 'invite-redirect',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const path = (req.url || '').split('?')[0]
            if (path === '/invite' || path === '/invite/') {
              res.statusCode = 301
              res.setHeader('Location', 'https://discord.gg/EHBYbfU2BH')
              res.end()
              return
            }

            next()
          })
        },
      },
    ],
    server: {
      host: true,
      port: Number.isFinite(devPort) ? devPort : 5173,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
