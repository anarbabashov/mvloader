import { NextRequest, NextResponse } from 'next/server'
import { downloadVideo, downloadAudio } from '@/lib/download-service'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/proxy-health'

const downloadSchema = z.object({
  url: z.string().url(),
  format: z.enum(['MP3', 'MP4']),
})

// Extract user IP from request headers
function getUserIP(request: NextRequest): string | undefined {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for')

  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim())
    return ips[0]
  }

  return realIP || cfConnectingIP || vercelForwardedFor || undefined
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Download request received:', body)
    
    // Check rate limiting
    const rateLimitCheck = checkRateLimit()
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          timeUntilReset: rateLimitCheck.timeUntilReset 
        },
        { status: 429 }
      )
    }
    
    const { url, format } = downloadSchema.parse(body)

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)/i
    if (!youtubeRegex.test(url)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      )
    }

    // Get user's IP address
    const userIP = getUserIP(request)
    console.log('🔽 Download request from IP:', userIP, 'Format:', format, 'URL:', url.substring(0, 50) + '...')

    // Generate unique download ID
    const downloadId = Date.now().toString()
    console.log('Generated downloadId:', downloadId)
    
    // Start download process immediately with user IP
    const downloadPromise = format === 'MP3' 
      ? downloadAudio(url, downloadId, userIP)
      : downloadVideo(url, downloadId, userIP)

    // Handle the promise but don't await it
    downloadPromise.catch((error) => {
      console.error('Download failed:', error)
    })

    console.log('Download process initiated')

    return NextResponse.json({ 
      success: true, 
      downloadId,
      message: 'Download started' 
    })
  } catch (error) {
    console.error('Download API error:', error)
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    )
  }
} 