// lib/youtube-bypass.ts
export const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
]

export const getRandomUserAgent = () => {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

export const getRandomHeaders = (userIP?: string) => {
  const baseHeaders = {
    'User-Agent': getRandomUserAgent(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0'
  }

  if (userIP) {
    return {
      ...baseHeaders,
      'X-Forwarded-For': userIP,
      'X-Real-IP': userIP,
      'CF-Connecting-IP': userIP
    }
  }

  return baseHeaders
}

export const createYtdlAgentWithProxy = (userIP?: string, proxyConfig?: any) => {
  const headers = getRandomHeaders(userIP)
  
  const agentOptions: any = { headers }
  
  if (proxyConfig) {
    agentOptions.proxy = proxyConfig
  }
  
  // Only bind to user IP if it's not localhost and no proxy is used
  if (userIP && userIP !== '127.0.0.1' && userIP !== '::1' && !proxyConfig) {
    agentOptions.localAddress = userIP
  }
  
  return agentOptions
}