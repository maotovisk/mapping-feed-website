const port = Number(Bun.env.PORT || '3000')
const runningInContainer = Bun.env.CONTAINERIZED === '1'

function normalizeProxyTarget(rawTarget: string): string {
  const trimmed = rawTarget.trim().replace(/\/+$/, '')
  if (!trimmed) {
    return ''
  }

  try {
    const url = new URL(trimmed)
    if (
      runningInContainer &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
    ) {
      url.hostname = 'host.docker.internal'
    }

    return url.toString().replace(/\/+$/, '')
  } catch {
    return trimmed
  }
}

const apiProxyTarget = normalizeProxyTarget(Bun.env.API_PROXY_TARGET || '')
const discordInviteUrl = 'https://discord.gg/EHBYbfU2BH'

const distRoot = new URL('./dist/', import.meta.url)
const indexFile = Bun.file(new URL('index.html', distRoot))

const buildAssetHeaders = (pathname: string): Headers => {
  const headers = new Headers()
  if (pathname.startsWith('/assets/')) {
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  } else {
    headers.set('Cache-Control', 'public, max-age=300')
  }

  headers.set('X-Content-Type-Options', 'nosniff')
  return headers
}

const proxyApiRequest = async (request: Request, pathname: string): Promise<Response> => {
  if (!apiProxyTarget) {
    return new Response('API proxy target is not configured', { status: 502 })
  }

  const sourceUrl = new URL(request.url)
  const targetUrl = `${apiProxyTarget}${pathname}${sourceUrl.search}`

  const headers = new Headers(request.headers)
  headers.delete('host')

  try {
    return await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.body,
      redirect: 'manual',
    })
  } catch {
    return Response.json(
      {
        error: 'upstream_unreachable',
        target: targetUrl,
      },
      { status: 502 },
    )
  }
}

const serveStatic = async (pathname: string): Promise<Response | null> => {
  const normalizedPath = pathname === '/' ? '/index.html' : pathname
  if (normalizedPath.includes('..')) {
    return new Response('Invalid path', { status: 400 })
  }

  const file = Bun.file(new URL(`.${normalizedPath}`, distRoot))
  if (await file.exists()) {
    return new Response(file, { headers: buildAssetHeaders(pathname) })
  }

  return null
}

Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url)

    if (url.pathname === '/invite' || url.pathname === '/invite/') {
      return new Response(null, {
        status: 301,
        headers: {
          Location: discordInviteUrl,
          'Cache-Control': 'public, max-age=600',
        },
      })
    }

    if (url.pathname.startsWith('/api/')) {
      return proxyApiRequest(request, url.pathname)
    }

    const staticResponse = await serveStatic(url.pathname)
    if (staticResponse) {
      return staticResponse
    }

    return new Response(indexFile, {
      headers: buildAssetHeaders('/index.html'),
    })
  },
})

console.log(`mapping-feed-website running on :${port}`)
console.log(
  apiProxyTarget
    ? `proxying /api/* -> ${apiProxyTarget}`
    : 'API proxy disabled (set API_PROXY_TARGET to enable)',
)
