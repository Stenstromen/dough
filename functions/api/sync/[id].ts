interface Env {
  SYNC: KVNamespace
  WORKER_SECRET: string
}

interface SyncPayload {
  updatedAt: number
  dayBudget: unknown
  weekBudget: unknown
  knownExpenses: unknown
}

interface SyncRecord {
  authHash: string
  updatedAt: number
  dayBudget: unknown
  weekBudget: unknown
  knownExpenses: unknown
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('Origin') ?? '*'
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'authorization, content-type',
    'access-control-max-age': '86400',
    vary: 'Origin',
  }
}

function withCors(response: Response, request: Request): Response {
  const headers = new Headers(response.headers)
  for (const [key, value] of Object.entries(corsHeaders(request))) {
    headers.set(key, value)
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function kvKey(id: string): string {
  return `sync:${id}`
}

function readBearer(request: Request): string | null {
  const header = request.headers.get('Authorization')
  if (!header) return null
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  return match?.[1]?.trim() || null
}

async function hashSecret(
  clientSecret: string,
  workerSecret: string,
): Promise<string> {
  const data = new TextEncoder().encode(`${clientSecret}${workerSecret}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function isValidPayload(value: unknown): value is SyncPayload {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.updatedAt === 'number' &&
    Number.isFinite(record.updatedAt) &&
    record.updatedAt >= 0 &&
    'dayBudget' in record &&
    'weekBudget' in record &&
    'knownExpenses' in record
  )
}

async function readRecord(
  env: Env,
  id: string,
): Promise<SyncRecord | null> {
  const raw = await env.SYNC.get(kvKey(id))
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as SyncRecord
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.authHash !== 'string' ||
      typeof parsed.updatedAt !== 'number'
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function requireEnv(env: Env): string | null {
  if (!env.WORKER_SECRET) return 'WORKER_SECRET is not configured'
  if (!env.SYNC) return 'SYNC KV binding is not configured'
  return null
}

export const onRequestOptions: PagesFunction<Env> = async (context) => {
  return withCors(new Response(null, { status: 204 }), context.request)
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, params, request } = context
  const configError = requireEnv(env)
  if (configError) {
    return withCors(json({ error: configError }, 500), request)
  }

  const id = typeof params.id === 'string' ? params.id : params.id?.[0]
  if (!id || !UUID_RE.test(id)) {
    return withCors(json({ error: 'Invalid sync id' }, 400), request)
  }

  const clientSecret = readBearer(request)
  if (!clientSecret) {
    return withCors(json({ error: 'Missing credentials' }, 401), request)
  }

  const record = await readRecord(env, id)
  if (!record) {
    return withCors(json({ error: 'Not found' }, 404), request)
  }

  const authHash = await hashSecret(clientSecret, env.WORKER_SECRET)
  if (authHash !== record.authHash) {
    return withCors(json({ error: 'Unauthorized' }, 401), request)
  }

  return withCors(
    json({
      updatedAt: record.updatedAt,
      dayBudget: record.dayBudget,
      weekBudget: record.weekBudget,
      knownExpenses: record.knownExpenses,
    }),
    request,
  )
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, params, request } = context
  const configError = requireEnv(env)
  if (configError) {
    return withCors(json({ error: configError }, 500), request)
  }

  const id = typeof params.id === 'string' ? params.id : params.id?.[0]
  if (!id || !UUID_RE.test(id)) {
    return withCors(json({ error: 'Invalid sync id' }, 400), request)
  }

  const clientSecret = readBearer(request)
  if (!clientSecret) {
    return withCors(json({ error: 'Missing credentials' }, 401), request)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return withCors(json({ error: 'Invalid JSON body' }, 400), request)
  }

  if (!isValidPayload(body)) {
    return withCors(json({ error: 'Invalid sync payload' }, 400), request)
  }

  const authHash = await hashSecret(clientSecret, env.WORKER_SECRET)
  const existing = await readRecord(env, id)

  if (existing) {
    if (existing.authHash !== authHash) {
      return withCors(json({ error: 'Unauthorized' }, 401), request)
    }
    if (body.updatedAt < existing.updatedAt) {
      return withCors(
        json(
          {
            error: 'Conflict',
            updatedAt: existing.updatedAt,
            dayBudget: existing.dayBudget,
            weekBudget: existing.weekBudget,
            knownExpenses: existing.knownExpenses,
          },
          409,
        ),
        request,
      )
    }
  }

  const next: SyncRecord = {
    authHash,
    updatedAt: body.updatedAt,
    dayBudget: body.dayBudget,
    weekBudget: body.weekBudget,
    knownExpenses: body.knownExpenses,
  }

  await env.SYNC.put(kvKey(id), JSON.stringify(next))

  return withCors(
    json({
      updatedAt: next.updatedAt,
      dayBudget: next.dayBudget,
      weekBudget: next.weekBudget,
      knownExpenses: next.knownExpenses,
    }),
    request,
  )
}
