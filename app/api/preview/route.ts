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

// Extract user IP from request headers
function getUserIP(request: NextRequest): string | undefined {
	// Common headers that contain the real client IP
	const forwardedFor = request.headers.get('x-forwarded-for')
	const realIP = request.headers.get('x-real-ip')
	const cfConnectingIP = request.headers.get('cf-connecting-ip') // Cloudflare
	const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for') // Vercel

	// x-forwarded-for can contain multiple IPs, get the first one
	if (forwardedFor) {
		const ips = forwardedFor.split(',').map(ip => ip.trim())
		return ips[0]
	}

	return realIP || cfConnectingIP || vercelForwardedFor || undefined
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

		// Get user's IP address
		const userIP = getUserIP(request)
		console.log('User IP:', userIP)

		// Try different approaches to bypass YouTube blocking
		let info: any = null
		let lastError: Error | null = null

		// Strategy 1: Try with user IP as localAddress (if available)
		if (userIP && userIP !== '127.0.0.1' && userIP !== '::1') {
			try {
				console.log('Attempting strategy 1: Using user IP as localAddress:', userIP)
				const agentOptions: any = {
					localAddress: userIP,
					headers: {
						'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
						'X-Forwarded-For': userIP,
						'X-Real-IP': userIP
					}
				}
				const agent = ytdl.createAgent(undefined, agentOptions)
				info = await ytdl.getInfo(url, { agent })
				console.log('Strategy 1 succeeded')
			} catch (error: any) {
				console.log('Strategy 1 failed:', error?.message || error)
				lastError = error as Error
			}
		}

		// Strategy 2: Try with just user IP headers (no localAddress)
		if (!info && userIP) {
			try {
				console.log('Attempting strategy 2: Using user IP headers without localAddress')
				const agentOptions: any = {
					headers: {
						'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
						'X-Forwarded-For': userIP,
						'X-Real-IP': userIP,
						'CF-Connecting-IP': userIP
					}
				}
				const agent = ytdl.createAgent(undefined, agentOptions)
				info = await ytdl.getInfo(url, { agent })
				console.log('Strategy 2 succeeded')
			} catch (error: any) {
				console.log('Strategy 2 failed:', error?.message || error)
				lastError = error as Error
			}
		}

		// Strategy 3: Try with different User-Agent and cookies
		if (!info) {
			try {
				console.log('Attempting strategy 3: Different User-Agent and cookie attempt')
				const agentOptions: any = {
					headers: {
						'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
						'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
						'Accept-Language': 'en-US,en;q=0.5',
						'Accept-Encoding': 'gzip, deflate',
						'DNT': '1',
						'Connection': 'keep-alive',
						'Upgrade-Insecure-Requests': '1'
					}
				}
				if (userIP) {
					agentOptions.headers['X-Forwarded-For'] = userIP
					agentOptions.headers['X-Real-IP'] = userIP
				}
				const agent = ytdl.createAgent(undefined, agentOptions)
				info = await ytdl.getInfo(url, { agent })
				console.log('Strategy 3 succeeded')
			} catch (error: any) {
				console.log('Strategy 3 failed:', error?.message || error)
				lastError = error as Error
			}
		}

		// Strategy 4: Fallback to basic approach without any special options
		if (!info) {
			try {
				console.log('Attempting strategy 4: Basic fallback approach')
				info = await ytdl.getInfo(url, {
					requestOptions: {
						headers: {
							'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
						}
					}
				})
				console.log('Strategy 4 succeeded')
			} catch (error: any) {
				console.log('Strategy 4 failed:', error?.message || error)
				lastError = error as Error
			}
		}

		// If all strategies failed, throw the last error
		if (!info) {
			console.error('All strategies failed. Last error:', lastError?.message)
			throw lastError || new Error('Failed to fetch video information after trying multiple strategies')
		}

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