import { NextRequest, NextResponse } from 'next/server'
import ytdl from '@distube/ytdl-core'
import { z } from 'zod'

const previewSchema = z.object({
	url: z.string().url(),
})

interface VideoPreview {
	title: string
	description: string
	thumbnail: string
	channelName: string
	publishDate: string
	duration: string
	viewCount: string
	videoId: string
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { url } = previewSchema.parse(body)

		// Validate YouTube URL
		const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)/i
		if (!youtubeRegex.test(url)) {
			return NextResponse.json(
				{ error: 'Invalid YouTube URL' },
				{ status: 400 }
			)
		}

		// Get video info
		const info = await ytdl.getInfo(url, {
			requestOptions: {
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
				}
			}
		})

		// Format duration from seconds to readable format
		const formatDuration = (seconds: number): string => {
			const hours = Math.floor(seconds / 3600)
			const minutes = Math.floor((seconds % 3600) / 60)
			const secs = seconds % 60

			if (hours > 0) {
				return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
			}
			return `${minutes}:${secs.toString().padStart(2, '0')}`
		}

		// Format view count
		const formatViewCount = (views: string): string => {
			const num = parseInt(views)
			if (num >= 1000000) {
				return `${(num / 1000000).toFixed(1)}M views`
			}
			if (num >= 1000) {
				return `${(num / 1000).toFixed(1)}K views`
			}
			return `${num} views`
		}

		const videoDetails = info.videoDetails
		const preview: VideoPreview = {
			title: videoDetails.title,
			description: videoDetails.description || '',
			thumbnail: videoDetails.thumbnails?.[videoDetails.thumbnails.length - 1]?.url || '',
			channelName: videoDetails.author?.name || videoDetails.ownerChannelName || 'Unknown Channel',
			publishDate: videoDetails.publishDate || 'Unknown',
			duration: formatDuration(parseInt(videoDetails.lengthSeconds)),
			viewCount: formatViewCount(videoDetails.viewCount),
			videoId: videoDetails.videoId
		}

		return NextResponse.json({
			success: true,
			preview
		})
	} catch (error) {
		console.error('Preview API error:', error)
		
		if (error instanceof Error && error.message.includes('Video unavailable')) {
			return NextResponse.json(
				{ error: 'Video is unavailable or private' },
				{ status: 404 }
			)
		}

		return NextResponse.json(
			{ error: 'Failed to fetch video information' },
			{ status: 500 }
		)
	}
} 