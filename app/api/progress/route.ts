import { NextRequest, NextResponse } from 'next/server'
import { getDownloadProgress } from '@/lib/download-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const downloadId = searchParams.get('downloadId')
    
    if (!downloadId) {
      return NextResponse.json(
        { error: 'Download ID is required' },
        { status: 400 }
      )
    }

    const progress = getDownloadProgress(downloadId)
    
    // Handle race condition on server restart
    if (progress.status === 'error' && progress.error === 'Download not found') {
      // Check if this is a very recent downloadId (within last 10 seconds)
      const downloadTimestamp = parseInt(downloadId)
      const now = Date.now()
      const timeDiff = now - downloadTimestamp
      
      // If the downloadId is very recent (less than 10 seconds), it's likely initializing
      if (timeDiff < 10000) {
        return NextResponse.json({
          downloadId,
          progress: 0,
          status: 'downloading'
        })
      }
    }
    
    return NextResponse.json(progress)
  } catch (error) {
    console.error('Progress error:', error)
    return NextResponse.json(
      { error: 'Failed to get progress' },
      { status: 500 }
    )
  }
} 