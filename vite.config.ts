import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/** Serves netlify/functions/* at their /api paths during `npm run dev`, so checkout works without the Netlify CLI. */
function netlifyFunctionsDev(): Plugin {
  const routes: Record<string, string> = {
    '/api/checkout': '/netlify/functions/checkout.ts',
    '/api/clover-webhook': '/netlify/functions/clover-webhook.ts',
    '/api/products': '/netlify/functions/products.ts',
  }
  return {
    name: 'netlify-functions-dev',
    configureServer(server) {
      // CLOVER_* keys from .env.local, available to functions as they are on Netlify.
      for (const [k, v] of Object.entries(loadEnv(server.config.mode, process.cwd(), 'CLOVER_'))) process.env[k] ??= v
      process.env.FA_LOCAL_DEV = '1' // functions use an in-memory store instead of Netlify Blobs

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const file = routes[url.pathname]
        if (!file) return next()
        try {
          const chunks: Buffer[] = []
          for await (const c of req) chunks.push(c as Buffer)
          const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
          const request = new Request(url, {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: hasBody ? Buffer.concat(chunks) : undefined,
          })
          const mod = await server.ssrLoadModule(file)
          const response: Response = await mod.default(request)
          res.statusCode = response.status
          response.headers.forEach((v, k) => res.setHeader(k, v))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (err) {
          next(err)
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), netlifyFunctionsDev()],
})
