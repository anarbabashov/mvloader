import { NextRequest, NextResponse } from 'next/server'
import ytdl from '@distube/ytdl-core'
import { z } from 'zod'
import { getRandomHeaders, createYtdlAgentWithProxy } from '@/lib/youtube-bypass'
import { checkRateLimit, initializeProxyHealth } from '@/lib/proxy-health'

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
		console.log('Preview request from IP:', userIP, 'for URL:', url)

		// Enhanced bypass strategies
		let info: any = null
		let lastError: Error | null = null

		// Check if running in development (localhost)
		const isDevelopment = process.env.NODE_ENV === 'development' || 
		                     process.env.VERCEL !== '1' ||
		                     userIP === '127.0.0.1' || 
		                     userIP === '::1' || 
		                     userIP === 'localhost'

		// Only use proxy in production, not localhost
		const proxyConfig = (!isDevelopment && process.env.PROXY_HOST) ? {
			host: process.env.PROXY_HOST,
			port: parseInt(process.env.PROXY_PORT || '3128'),
			auth: process.env.PROXY_USERNAME ? {
				username: process.env.PROXY_USERNAME,
				password: process.env.PROXY_PASSWORD || ''
			} : undefined
		} : undefined

		console.log('🔧 Preview API - Environment check:', {
			isDevelopment: isDevelopment,
			userIP: userIP,
			hasProxy: !!proxyConfig,
			host: proxyConfig?.host
		})

		// Initialize proxy health monitoring if proxy is configured
		if (proxyConfig) {
			initializeProxyHealth(proxyConfig)
		}

		const strategies = [
			{
				name: 'Randomized headers with user IP',
				config: createYtdlAgentWithProxy(userIP)
			},
			{
				name: 'Proxy with randomized headers',
				config: createYtdlAgentWithProxy(userIP, proxyConfig)
			},
			{
				name: 'Different user agent rotation',
				config: createYtdlAgentWithProxy(userIP)
			},
			{
				name: 'Basic fallback',
				config: { headers: getRandomHeaders() }
			}
		]

		for (const strategy of strategies) {
			if (info) break
			
			try {
				console.log(`Attempting strategy: ${strategy.name}`)
				const agent = ytdl.createAgent(undefined, strategy.config)
				
				// Add timing for performance monitoring
				const startTime = Date.now()
				info = await ytdl.getInfo(url, { agent })
				const duration = Date.now() - startTime
				
				console.log(`✅ ${strategy.name} succeeded in ${duration}ms`)
				
				// Log proxy usage for verification
				if (strategy.name.includes('Proxy') && proxyConfig) {
					console.log(`🔄 Request routed through proxy: ${proxyConfig.host}:${proxyConfig.port}`)
				}
				
				break
			} catch (error: any) {
				console.log(`❌ ${strategy.name} failed:`, error?.message?.substring(0, 100))
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