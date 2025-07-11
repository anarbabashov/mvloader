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
    
    return NextResponse.json(progress)
  } catch (error) {
    console.error('Progress error:', error)
    return NextResponse.json(
      { error: 'Failed to get progress' },
      { status: 500 }
    )
  }
} 