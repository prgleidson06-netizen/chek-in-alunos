import { createHmac, timingSafeEqual } from 'crypto'

const COOKIE_NAME = 'fju_admin_session'
const SESSION_SECONDS = 60 * 60 * 12

const getAdminPassword = () => process.env.ADMIN_PASSWORD || 'fju2024'
const getSecret = () => process.env.ADMIN_SESSION_SECRET || getAdminPassword()

function sign(value: string) {
  return createHmac('sha256', getSecret()).update(value).digest('hex')
}

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a)
  const bBuffer = Buffer.from(b)

  if (aBuffer.length !== bBuffer.length) return false
  return timingSafeEqual(aBuffer, bBuffer)
}

export function verifyAdminPassword(password: string) {
  return safeEqual(password, getAdminPassword())
}

export function createAdminSession() {
  const expiresAt = Date.now() + SESSION_SECONDS * 1000
  const payload = `admin:${expiresAt}`
  return `${payload}:${sign(payload)}`
}

export function isValidAdminSession(token?: string | null) {
  if (!token) return false

  const parts = token.split(':')
  if (parts.length !== 3) return false

  const [role, expiresAt, signature] = parts
  if (role !== 'admin') return false
  if (!expiresAt || Number(expiresAt) < Date.now()) return false

  return safeEqual(signature, sign(`${role}:${expiresAt}`))
}

export function isAdminRequest(request: Request) {
  const cookie = request.headers
    .get('cookie')
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`))

  const token = cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : null
  return isValidAdminSession(token)
}

export function setAdminCookie(response: Response) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  response.headers.append(
    'Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(createAdminSession())}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_SECONDS}${secure}`
  )
}

export function clearAdminCookie(response: Response) {
  response.headers.append(
    'Set-Cookie',
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  )
}
