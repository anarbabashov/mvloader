import ytdl from '@distube/ytdl-core'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { createTempFile } from './temp-service'

// Try to set up FFmpeg, but continue without it if it fails
let ffmpegAvailable = false
try {
  const ffmpeg = require('fluent-ffmpeg')
  // Try system FFmpeg first
  ffmpeg.setFfmpegPath('ffmpeg')
  ffmpegAvailable = true
} catch (error) {
  console.warn('FFmpeg not available, will download audio in original format')
}

// Filename formatting function for better readability
function formatFilename(title: string): string {
  return title
    // First, handle common patterns
    .replace(/\s*_\s*/g, ' - ')  // Replace underscores with hyphens (with spaces)
    .replace(/\s*\|\s*/g, ' - ') // Replace pipes with hyphens
    .replace(/\s*-\s*/g, ' - ')  // Normalize existing hyphens with proper spacing
    // Handle parentheses and brackets - convert underscores inside them
    .replace(/\(\s*([^)]*?)\s*\)/g, (match, content) => {
      return `(${content.replace(/_/g, ' ').trim()})`
    })
    .replace(/\[\s*([^\]]*?)\s*\]/g, (match, content) => {
      return `[${content.replace(/_/g, ' ').trim()}]`
    })
    // Remove or replace problematic characters for filenames
    .replace(/[<>:"/\\|?*]/g, '')  // Remove invalid filename characters
    .replace(/['']/g, "'")         // Normalize apostrophes
    .replace(/[""]/g, '"')         // Normalize quotes
    .replace(/\s+/g, ' ')          // Collapse multiple spaces
    .trim()
}

// Get user's Downloads folder
const getDownloadsPath = () => {
  const homeDir = os.homedir()
  return path.join(homeDir, 'Downloads')
}

// Progress tracking
interface DownloadProgress {
  downloadId: string
  progress: number
  status: 'downloading' | 'converting' | 'completed' | 'error'
  filename?: string
  error?: string
  tempId?: string // For temp downloads
}

const progressMap = new Map<string, DownloadProgress>()

export function getDownloadProgress(downloadId: string): DownloadProgress {
  const progress = progressMap.get(downloadId) || { 
    downloadId, 
    progress: 0, 
    status: 'error', 
    error: 'Download not found' 
  }
  return progress
}

// Set initial progress to prevent "Download not found" errors
export function setInitialProgress(downloadId: string): void {
  progressMap.set(downloadId, { 
    downloadId, 
    progress: 0, 
    status: 'downloading' 
  })
}

// Download to temp folder for preview mode
export async function downloadToTemp(url: string, downloadId: string, format: 'MP3' | 'MP4'): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // Initial progress is already set by setInitialProgress() before this function is called
      
      const info = await ytdl.getInfo(url, {
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        }
      })
      
      const title = formatFilename(info.videoDetails.title)
      const fileName = format === 'MP3' ? `${title}.mp3` : `${title}.mp4`
      
      // Create temp file using downloadId as tempId to maintain consistency
      const { tempId, tempPath } = createTempFile(fileName, downloadId)

      if (format === 'MP3') {
        await downloadAudioToTemp(url, downloadId, tempId, tempPath, title)
      } else {
        await downloadVideoToTemp(url, downloadId, tempId, tempPath, title)
      }

      resolve(tempId)
    } catch (error) {
      progressMap.set(downloadId, { 
        downloadId, 
        progress: 0, 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      reject(error)
    }
  })
}

async function downloadAudioToTemp(url: string, downloadId: string, tempId: string, tempPath: string, title: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const tempAudioPath = ffmpegAvailable 
        ? path.join(path.dirname(tempPath), `temp_${path.basename(tempPath, '.mp3')}.m4a`)
        : tempPath

      const audioStream = ytdl(url, { 
        quality: 'highestaudio',
        filter: 'audioonly',
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        }
      })

      audioStream.on('progress', (chunkLength, downloaded, total) => {
        const percent = ffmpegAvailable 
          ? Math.round((downloaded / total) * 50) // 50% for download if converting
          : Math.round((downloaded / total) * 100) // 100% if no conversion
        
        // Preserve existing progress entry and only update progress/status, keeping tempId
        const existingProgress = progressMap.get(downloadId)
        progressMap.set(downloadId, { 
          ...existingProgress,
          downloadId, 
          progress: percent, 
          status: 'downloading', 
          tempId 
        })
      })

      audioStream.on('error', (error) => {
        const existingProgress = progressMap.get(downloadId)
        progressMap.set(downloadId, { 
          ...existingProgress,
          downloadId, 
          progress: 0, 
          status: 'error', 
          error: error.message, 
          tempId 
        })
        reject(error)
      })

      const writeStream = fs.createWriteStream(tempAudioPath)
      audioStream.pipe(writeStream)

      writeStream.on('finish', () => {
        if (ffmpegAvailable) {
          // Convert with FFmpeg
          const ffmpeg = require('fluent-ffmpeg')
          ffmpeg(tempAudioPath)
            .audioCodec('libmp3lame')
            .audioBitrate(320)
            .format('mp3')
            .on('progress', (progress: { percent?: number }) => {
              const percent = Math.round(50 + (progress.percent || 0) * 0.5)
              const existingProgress = progressMap.get(downloadId)
              progressMap.set(downloadId, { 
                ...existingProgress,
                downloadId, 
                progress: percent, 
                status: 'converting', 
                tempId 
              })
            })
            .on('end', () => {
              fs.unlinkSync(tempAudioPath) // Remove temp audio file
              const existingProgress = progressMap.get(downloadId)
              progressMap.set(downloadId, { 
                ...existingProgress,
                downloadId, 
                progress: 100, 
                status: 'completed', 
                filename: `${title}.mp3`,
                tempId
              })
              resolve()
            })
            .on('error', (error: Error) => {
              console.error('FFmpeg conversion error:', error)
              const existingProgress = progressMap.get(downloadId)
              progressMap.set(downloadId, { 
                ...existingProgress,
                downloadId, 
                progress: 0, 
                status: 'error', 
                error: `Conversion failed: ${error.message}`,
                tempId
              })
              reject(error)
            })
            .save(tempPath)
        } else {
          // No FFmpeg available
          const existingProgress = progressMap.get(downloadId)
          progressMap.set(downloadId, { 
            ...existingProgress,
            downloadId, 
            progress: 100, 
            status: 'completed', 
            filename: `${title}.mp3`,
            tempId
          })
          resolve()
        }
      })

      writeStream.on('error', (error) => {
        const existingProgress = progressMap.get(downloadId)
        progressMap.set(downloadId, { 
          ...existingProgress,
          downloadId, 
          progress: 0, 
          status: 'error', 
          error: error.message, 
          tempId 
        })
        reject(error)
      })
    } catch (error) {
      const existingProgress = progressMap.get(downloadId)
      progressMap.set(downloadId, { 
        ...existingProgress,
        downloadId, 
        progress: 0, 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        tempId
      })
      reject(error)
    }
  })
}

async function downloadVideoToTemp(url: string, downloadId: string, tempId: string, tempPath: string, title: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const videoStream = ytdl(url, { 
        quality: 'highest',
        filter: 'videoandaudio',
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        }
      })

      videoStream.on('progress', (chunkLength, downloaded, total) => {
        const percent = Math.round((downloaded / total) * 100)
        
        // Preserve existing progress entry and only update progress/status, keeping tempId
        const existingProgress = progressMap.get(downloadId)
        progressMap.set(downloadId, { 
          ...existingProgress,
          downloadId, 
          progress: percent, 
          status: 'downloading', 
          tempId 
        })
      })

      videoStream.on('error', (error) => {
        const existingProgress = progressMap.get(downloadId)
        progressMap.set(downloadId, { 
          ...existingProgress,
          downloadId, 
          progress: 0, 
          status: 'error', 
          error: error.message, 
          tempId 
        })
        reject(error)
      })

      const writeStream = fs.createWriteStream(tempPath)
      videoStream.pipe(writeStream)

      writeStream.on('finish', () => {
        const existingProgress = progressMap.get(downloadId)
        progressMap.set(downloadId, { 
          ...existingProgress,
          downloadId, 
          progress: 100, 
          status: 'completed', 
          filename: `${title}.mp4`,
          tempId
        })
        resolve()
      })

      writeStream.on('error', (error) => {
        const existingProgress = progressMap.get(downloadId)
        progressMap.set(downloadId, { 
          ...existingProgress,
          downloadId, 
          progress: 0, 
          status: 'error', 
          error: error.message, 
          tempId 
        })
        reject(error)
      })
    } catch (error) {
      const existingProgress = progressMap.get(downloadId)
      progressMap.set(downloadId, { 
        ...existingProgress,
        downloadId, 
        progress: 0, 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        tempId
      })
      reject(error)
    }
  })
}

export async function downloadAudio(url: string, downloadId: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // Set initial progress IMMEDIATELY
      progressMap.set(downloadId, { downloadId, progress: 0, status: 'downloading' })

      const info = await ytdl.getInfo(url, {
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        }
      })
      
      const title = formatFilename(info.videoDetails.title)
      
      // If FFmpeg is available, use conversion; otherwise download directly as MP3-named file
      const finalAudioPath = path.join(getDownloadsPath(), `${title}.mp3`)
      const tempAudioPath = ffmpegAvailable 
        ? path.join(getDownloadsPath(), `${title}_temp.m4a`)
        : finalAudioPath

      const audioStream = ytdl(url, { 
        quality: 'highestaudio',
        filter: 'audioonly',
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        }
      })

      audioStream.on('progress', (chunkLength, downloaded, total) => {
        const percent = ffmpegAvailable 
          ? Math.round((downloaded / total) * 50) // 50% for download if converting
          : Math.round((downloaded / total) * 100) // 100% if no conversion
        progressMap.set(downloadId, { downloadId, progress: percent, status: 'downloading' })
      })

      audioStream.on('error', (error) => {
        progressMap.set(downloadId, { downloadId, progress: 0, status: 'error', error: error.message })
        reject(error)
      })

      const writeStream = fs.createWriteStream(tempAudioPath)
      audioStream.pipe(writeStream)

      writeStream.on('finish', () => {
        if (ffmpegAvailable) {
          // Convert with FFmpeg
          const ffmpeg = require('fluent-ffmpeg')
          ffmpeg(tempAudioPath)
            .audioCodec('libmp3lame')
            .audioBitrate(320)
            .format('mp3')
            .on('progress', (progress: { percent?: number }) => {
              const percent = Math.round(50 + (progress.percent || 0) * 0.5)
              progressMap.set(downloadId, { downloadId, progress: percent, status: 'converting' })
            })
            .on('end', () => {
              fs.unlinkSync(tempAudioPath)
              progressMap.set(downloadId, { 
                downloadId, 
                progress: 100, 
                status: 'completed', 
                filename: `${title}.mp3` 
              })
              resolve(finalAudioPath)
            })
            .on('error', (error: Error) => {
              console.error('FFmpeg conversion error:', error)
              progressMap.set(downloadId, { 
                downloadId, 
                progress: 0, 
                status: 'error', 
                error: `Conversion failed: ${error.message}` 
              })
              reject(error)
            })
            .save(finalAudioPath)
        } else {
          // No FFmpeg available, file is already saved with .mp3 extension
          progressMap.set(downloadId, { 
            downloadId, 
            progress: 100, 
            status: 'completed', 
            filename: `${title}.mp3` 
          })
          resolve(finalAudioPath)
        }
      })

      writeStream.on('error', (error) => {
        progressMap.set(downloadId, { downloadId, progress: 0, status: 'error', error: error.message })
        reject(error)
      })
    } catch (error) {
      progressMap.set(downloadId, { 
        downloadId, 
        progress: 0, 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      reject(error)
    }
  })
}

export async function downloadVideo(url: string, downloadId: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      progressMap.set(downloadId, { downloadId, progress: 0, status: 'downloading' })

      const info = await ytdl.getInfo(url, {
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        }
      })
      
      const title = formatFilename(info.videoDetails.title)
      const finalVideoPath = path.join(getDownloadsPath(), `${title}.mp4`)

      const videoStream = ytdl(url, { 
        quality: 'highest',
        filter: 'videoandaudio',
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        }
      })

      videoStream.on('progress', (chunkLength, downloaded, total) => {
        const percent = Math.round((downloaded / total) * 100)
        progressMap.set(downloadId, { downloadId, progress: percent, status: 'downloading' })
      })

      videoStream.on('error', (error) => {
        progressMap.set(downloadId, { downloadId, progress: 0, status: 'error', error: error.message })
        reject(error)
      })

      const writeStream = fs.createWriteStream(finalVideoPath)
      videoStream.pipe(writeStream)

      writeStream.on('finish', () => {
        progressMap.set(downloadId, { 
          downloadId, 
          progress: 100, 
          status: 'completed', 
          filename: `${title}.mp4` 
        })
        resolve(finalVideoPath)
      })

      writeStream.on('error', (error) => {
        progressMap.set(downloadId, { downloadId, progress: 0, status: 'error', error: error.message })
        reject(error)
      })
    } catch (error) {
      progressMap.set(downloadId, { 
        downloadId, 
        progress: 0, 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      reject(error)
    }
  })
} 