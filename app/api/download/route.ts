import { NextRequest, NextResponse } from 'next/server'
import { downloadVideo, downloadAudio } from '@/lib/download-service'
import { z } from 'zod'

const downloadSchema = z.object({
  url: z.string().url(),
  format: z.enum(['MP3', 'MP4']),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Download request received:', body)
    
    const { url, format } = downloadSchema.parse(body)

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)/i
    if (!youtubeRegex.test(url)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      )
    }

    // Generate unique download ID
    const downloadId = Date.now().toString()
    console.log('Generated downloadId:', downloadId)
    
    // Start download process immediately
    const downloadPromise = format === 'MP3' 
      ? downloadAudio(url, downloadId)
      : downloadVideo(url, downloadId)

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