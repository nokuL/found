import { adminConfig, checkLogin, logoutCookie, sessionCookie } from '../../server/admin.js'
import { json, str } from '../../server/config.js'

/** Logs in to /admin: sets a session cookie when the username and password match ADMIN_USERNAME and ADMIN_PASSWORD. */
export async function POST(req: Request) {
  if (!adminConfig()) return json({ error: 'Admin login is not set up. Add ADMIN_USERNAME and ADMIN_PASSWORD in Vercel.' }, 503)
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid request' }, 400)
  }
  if (!(await checkLogin(str(body.username), str(body.password, 200)))) return json({ error: 'Wrong username or password.' }, 401)
  const res = json({ ok: true })
  res.headers.set('Set-Cookie', sessionCookie())
  return res
}

export async function DELETE() {
  const res = json({ ok: true })
  res.headers.set('Set-Cookie', logoutCookie())
  return res
}
