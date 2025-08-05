// lib/youtube-extractors.ts
import ytdl from '@distube/ytdl-core'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface VideoInfo {
  title: string
  description: string
  thumbnail: string
  channelName: string
  publishDate: string
  duration: string
  viewCount: string
  videoId: string
}

// Primary extractor using ytdl-core
export async function extractWithYtdl(url: string, agent?: any): Promise<VideoInfo> {
  const info = await ytdl.getInfo(url, { agent })
  const videoDetails = info.videoDetails
  
  return {
    title: videoDetails.title,
    description: videoDetails.description || '',
    thumbnail: videoDetails.thumbnails?.[videoDetails.thumbnails.length - 1]?.url || '',
    channelName: videoDetails.author?.name || videoDetails.ownerChannelName || 'Unknown Channel',
    publishDate: videoDetails.publishDate || 'Unknown',
    duration: formatDuration(parseInt(videoDetails.lengthSeconds)),
    viewCount: formatViewCount(videoDetails.viewCount),
    videoId: videoDetails.videoId
  }
}

// Fallback using youtube-dl-exec
export async function extractWithYoutubeDl(url: string): Promise<VideoInfo> {
  try {
    const { exec } = require('youtube-dl-exec')
    const info = await exec(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificates: true,
      preferFreeFormats: true,
      addHeader: [
        'referer:youtube.com',
        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      ]
    })
    
    return {
      title: info.title || 'Unknown Title',
      description: info.description || '',
      thumbnail: info.thumbnail || '',
      channelName: info.uploader || 'Unknown Channel',
      publishDate: info.upload_date || 'Unknown',
      duration: formatDuration(info.duration || 0),
      viewCount: formatViewCount(info.view_count?.toString() || '0'),
      videoId: info.id || ''
    }
  } catch (error) {
    throw new Error(`youtube-dl-exec failed: ${error}`)
  }
}

// Helper functions
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

function formatViewCount(views: string): string {
  const num = parseInt(views)
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M views`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K views`
  }
  return `${num} views`
}