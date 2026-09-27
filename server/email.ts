import { USER_AGENT } from './config.js'

/** Emails the shop's inbox (NOTIFY_EMAIL) through Resend. Returns false, and logs why, when it can't. */
export async function emailShop(msg: { subject: string; text: string; replyTo?: string }) {
  const key = process.env.RESEND_API_KEY
  const to = process.env.NOTIFY_EMAIL
  const from = process.env.EMAIL_FROM
  if (!key || !to || !from) {
    console.error('Email skipped: set RESEND_API_KEY, NOTIFY_EMAIL, and EMAIL_FROM.', msg.subject)
    return false
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'User-Agent': USER_AGENT },
    body: JSON.stringify({
      from,
      to: to.split(',').map((s) => s.trim()),
      subject: msg.subject.replace(/\s+/g, ' '),
      text: msg.text,
      ...(msg.replyTo && { reply_to: msg.replyTo }),
    }),
  })
  if (!res.ok) console.error('Email failed', res.status, await res.text())
  return res.ok
}
