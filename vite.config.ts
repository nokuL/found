import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/** Serves api/* at their /api paths during `npm run dev`, so checkout works without the Vercel CLI. */
function vercelFunctionsDev(): Plugin {
  const routes: Record<string, string> = {
    '/api/checkout': '/api/checkout.ts',
    '/api/clover-webhook': '/api/clover-webhook.ts',
    '/api/contact': '/api/contact.ts',
    '/api/products': '/api/products.ts',
  }
  return {
    name: 'vercel-functions-dev',
    configureServer(server) {
      // Server keys from .env.local, available to functions as they are on Vercel.
      const env = loadEnv(server.config.mode, process.cwd(), ['CLOVER_', 'RESEND_', 'NOTIFY_', 'EMAIL_'])
      for (const [k, v] of Object.entries(env)) process.env[k] ??= v
      process.env.FA_LOCAL_DEV = '1' // functions use an in-memory store instead of Redis

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
          // Vercel calls the export named after the HTTP method, and answers 405 when there isn't one.
          const handler = mod[req.method ?? 'GET'] as ((r: Request) => Promise<Response>) | undefined
          const response = handler ? await handler(request) : new Response(null, { status: 405 })
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
  plugins: [react(), tailwindcss(), vercelFunctionsDev()],
})
