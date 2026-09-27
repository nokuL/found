import { json, str } from '../server/config.js'
import { emailShop } from '../server/email.js'

/** The contact form. Emails the message to the shop, with Reply-To set to the sender. */
export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid request' }, 400)
  }
  if (str(body['bot-field'])) return json({ ok: true }) // honeypot: bots fill in the hidden field

  const name = str(body.name, 100)
  const email = str(body.email, 120)
  const topic = str(body.topic, 60) || 'General question'
  const message = str(body.message, 5000)
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || !message) return json({ error: 'Please fill in your name, email, and message.' }, 400)

  const sent = await emailShop({
    subject: `Website message: ${topic} (${name})`,
    text: `From: ${name} <${email}>\nTopic: ${topic}\n\n${message}`,
    replyTo: email,
  })
  return sent ? json({ ok: true }) : json({ error: 'Message not sent' }, 502)
}
