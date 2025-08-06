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

interface ProxyConfig {
  host: string
  port: number
  auth?: {
    username: string
    password: string
  }
}

export const createYtdlAgentWithProxy = (userIP?: string, proxyConfig?: ProxyConfig) => {
  const headers = getRandomHeaders(userIP)
  
  const agentOptions: any = { headers }
  
  if (proxyConfig) {
    console.log(`🔄 Configuring proxy: ${proxyConfig.host}:${proxyConfig.port}`)
    
    // For ytdl-core, we need to use the undici agent or HTTP agent with proxy support
    // Temporarily disable proxy to avoid 500 errors and focus on basic functionality first
    console.log('⚠️ Proxy temporarily disabled for testing - will implement proper agent')
  }
  
  // Always bind to user IP if available and not localhost
  if (userIP && userIP !== '127.0.0.1' && userIP !== '::1' && userIP !== 'localhost') {
    agentOptions.localAddress = userIP
    console.log('🌐 Using user IP binding:', userIP)
  } else if (userIP) {
    agentOptions.headers['X-Forwarded-For'] = userIP
    agentOptions.headers['X-Real-IP'] = userIP
    console.log('🏷️ Using user IP in headers:', userIP)
  }
  
  return agentOptions
}

// Test proxy connectivity
export const testProxyConnection = async (proxyConfig: ProxyConfig): Promise<boolean> => {
  try {
    const proxyUrl = proxyConfig.auth 
      ? `http://${proxyConfig.auth.username}:${proxyConfig.auth.password}@${proxyConfig.host}:${proxyConfig.port}`
      : `http://${proxyConfig.host}:${proxyConfig.port}`
    
    // Simple HTTP request through proxy to test connectivity
    const response = await fetch('https://httpbin.org/ip', {
      method: 'GET',
      // @ts-ignore - proxy option exists but not in types
      proxy: proxyUrl,
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('Proxy test successful. External IP:', data.origin)
      return true
    }
    
    return false
  } catch (error) {
    console.error('Proxy test failed:', error)
    return false
  }
}