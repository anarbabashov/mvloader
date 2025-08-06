import { NextResponse } from 'next/server'
import { getProxyHealth, getRateLimitStats } from '@/lib/proxy-health'

export async function GET() {
  try {
    const proxyHealth = getProxyHealth()
    const rateLimitStats = getRateLimitStats()
    
    return NextResponse.json({
      success: true,
      proxy: proxyHealth ? {
        isHealthy: proxyHealth.isHealthy,
        responseTime: proxyHealth.responseTime,
        lastCheck: proxyHealth.lastCheck,
        errorCount: proxyHealth.errorCount,
        successCount: proxyHealth.successCount,
        currentIP: proxyHealth.currentIP
      } : null,
      rateLimit: rateLimitStats
    })
  } catch (error) {
    console.error('Proxy status API error:', error)
    return NextResponse.json(
      { error: 'Failed to get proxy status' },
      { status: 500 }
    )
  }
}