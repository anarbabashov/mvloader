// lib/proxy-health.ts
interface ProxyConfig {
  host: string
  port: number
  auth?: {
    username: string
    password: string
  }
}

interface ProxyHealthStats {
  isHealthy: boolean
  responseTime: number
  lastCheck: Date
  errorCount: number
  successCount: number
  currentIP?: string
}

class ProxyHealthMonitor {
  private stats: ProxyHealthStats = {
    isHealthy: false,
    responseTime: 0,
    lastCheck: new Date(),
    errorCount: 0,
    successCount: 0
  }

  private checkInterval?: NodeJS.Timeout
  private readonly maxErrors = 5
  private readonly checkIntervalMs = 30000 // 30 seconds

  constructor(private proxyConfig: ProxyConfig) {
    this.startHealthCheck()
  }

  async checkHealth(): Promise<ProxyHealthStats> {
    const startTime = Date.now()
    
    try {
      const proxyUrl = this.proxyConfig.auth 
        ? `http://${this.proxyConfig.auth.username}:${this.proxyConfig.auth.password}@${this.proxyConfig.host}:${this.proxyConfig.port}`
        : `http://${this.proxyConfig.host}:${this.proxyConfig.port}`

      // Test proxy with a simple HTTP request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch('https://httpbin.org/ip', {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'MVLoader-HealthCheck/1.0'
        }
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        const responseTime = Date.now() - startTime
        
        this.stats = {
          isHealthy: true,
          responseTime,
          lastCheck: new Date(),
          errorCount: Math.max(0, this.stats.errorCount - 1), // Gradually decrease error count on success
          successCount: this.stats.successCount + 1,
          currentIP: data.origin
        }

        console.log(`Proxy health check passed. Response time: ${responseTime}ms, IP: ${data.origin}`)
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      this.stats = {
        isHealthy: this.stats.errorCount < this.maxErrors,
        responseTime,
        lastCheck: new Date(),
        errorCount: this.stats.errorCount + 1,
        successCount: this.stats.successCount,
        currentIP: undefined
      }

      console.error(`Proxy health check failed: ${error}`)
    }

    return { ...this.stats }
  }

  startHealthCheck() {
    // Initial check
    this.checkHealth()

    // Schedule periodic checks
    this.checkInterval = setInterval(() => {
      this.checkHealth()
    }, this.checkIntervalMs)
  }

  stopHealthCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = undefined
    }
  }

  getStats(): ProxyHealthStats {
    return { ...this.stats }
  }

  isHealthy(): boolean {
    return this.stats.isHealthy
  }
}

// Singleton instance
let proxyMonitor: ProxyHealthMonitor | null = null

export const initializeProxyHealth = (proxyConfig: ProxyConfig) => {
  if (!proxyMonitor) {
    proxyMonitor = new ProxyHealthMonitor(proxyConfig)
  }
  return proxyMonitor
}

export const getProxyHealth = (): ProxyHealthStats | null => {
  return proxyMonitor?.getStats() || null
}

export const isProxyHealthy = (): boolean => {
  return proxyMonitor?.isHealthy() || false
}

// Rate limiting functionality
class RateLimiter {
  private requests: number[] = []
  private readonly windowMs: number
  private readonly maxRequests: number

  constructor(windowMs: number = 60000, maxRequests: number = 30) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
  }

  canMakeRequest(): boolean {
    const now = Date.now()
    
    // Remove requests outside the current window
    this.requests = this.requests.filter(timestamp => now - timestamp < this.windowMs)
    
    // Check if we can make a new request
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now)
      return true
    }
    
    return false
  }

  getRequestCount(): number {
    const now = Date.now()
    this.requests = this.requests.filter(timestamp => now - timestamp < this.windowMs)
    return this.requests.length
  }

  getTimeUntilReset(): number {
    if (this.requests.length === 0) return 0
    
    const now = Date.now()
    const oldestRequest = Math.min(...this.requests)
    return Math.max(0, this.windowMs - (now - oldestRequest))
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter(60000, 30) // 30 requests per minute

export const checkRateLimit = (): { allowed: boolean; timeUntilReset?: number } => {
  if (rateLimiter.canMakeRequest()) {
    return { allowed: true }
  }
  
  return { 
    allowed: false, 
    timeUntilReset: rateLimiter.getTimeUntilReset() 
  }
}

export const getRateLimitStats = () => ({
  currentRequests: rateLimiter.getRequestCount(),
  maxRequests: 30,
  timeUntilReset: rateLimiter.getTimeUntilReset()
})