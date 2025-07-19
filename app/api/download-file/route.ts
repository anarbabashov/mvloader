import { NextRequest, NextResponse } from 'next/server'
import { downloadToTemp } from '@/lib/download-service'
import { moveTempFileToDownloads, getTempFile } from '@/lib/temp-service'
import { z } from 'zod'
import path from 'path'
import os from 'os'
import fs from 'fs'

const downloadSchema = z.object({
	url: z.string().url(),
	format: z.enum(['MP3', 'MP4']),
})

const moveToDownloadsSchema = z.object({
	tempId: z.string(),
})

// GET: Serve file for browser download
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const tempId = searchParams.get('tempId')
		
		if (!tempId) {
			return NextResponse.json(
				{ error: 'Temp ID is required' },
				{ status: 400 }
			)
		}

		// Get temp file info
		const tempFile = getTempFile(tempId)
		if (!tempFile || !fs.existsSync(tempFile.filePath)) {
			return NextResponse.json(
				{ error: 'File not found or expired' },
				{ status: 404 }
			)
		}

		// Read the file
		const fileBuffer = fs.readFileSync(tempFile.filePath)
		
		// Determine content type based on file extension
		const ext = path.extname(tempFile.originalName).toLowerCase()
		const contentType = ext === '.mp3' ? 'audio/mpeg' : 'video/mp4'
		
		// Sanitize filename for Content-Disposition header
		// Replace problematic Unicode characters and ensure ASCII compatibility
		const sanitizedFilename = tempFile.originalName
			.replace(/[""]/g, '"')           // Replace smart quotes
			.replace(/['']/g, "'")           // Replace smart apostrophes  
			.replace(/[—–]/g, '-')           // Replace em/en dashes with hyphen
			.replace(/[^\x20-\x7E]/g, '_')   // Replace any non-ASCII chars with underscore
			.replace(/[<>:"/\\|?*]/g, '_')   // Replace invalid filename chars
		
		// Create Content-Disposition header with both ASCII fallback and UTF-8 encoded filename
		const encodedFilename = encodeURIComponent(tempFile.originalName)
		const contentDisposition = `attachment; filename="${sanitizedFilename}"; filename*=UTF-8''${encodedFilename}`
		
		// Return file as download
		return new NextResponse(fileBuffer, {
			status: 200,
			headers: {
				'Content-Type': contentType,
				'Content-Disposition': contentDisposition,
				'Content-Length': fileBuffer.length.toString(),
			},
		})
	} catch (error) {
		console.error('File serve error:', error)
		return NextResponse.json(
			{ error: 'Failed to serve file' },
			{ status: 500 }
		)
	}
}

// POST: Download to temp folder
export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
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
		
		// Set initial progress IMMEDIATELY to prevent "Download not found" errors
		const { setInitialProgress } = await import('@/lib/download-service')
		setInitialProgress(downloadId)
		
		// Add a tiny delay to ensure progress is committed before responding
		await new Promise(resolve => setTimeout(resolve, 10))
		
		// Start download to temp folder (don't await - let it run in background)
		downloadToTemp(url, downloadId, format).catch((error) => {
			console.error('Download to temp failed:', error)
		})
		
		return NextResponse.json({ 
			success: true, 
			downloadId,
			tempId: downloadId, // Use downloadId as tempId initially
			message: 'Download to temp started' 
		})
	} catch (error) {
		console.error('Download API error:', error)
		return NextResponse.json(
			{ error: 'Invalid request data' },
			{ status: 400 }
		)
	}
}

// PUT: Move temp file to Downloads folder
export async function PUT(request: NextRequest) {
	try {
		const body = await request.json()
		const { tempId } = moveToDownloadsSchema.parse(body)

		// Get temp file info
		const tempFile = getTempFile(tempId)
		if (!tempFile) {
			return NextResponse.json(
				{ error: 'Temp file not found or expired' },
				{ status: 404 }
			)
		}

		// Get user's Downloads folder
		const homeDir = os.homedir()
		const downloadsPath = path.join(homeDir, 'Downloads', tempFile.originalName)

		// Move file to Downloads folder
		const result = moveTempFileToDownloads(tempId, downloadsPath)
		
		if (result.success) {
			const finalFilename = result.finalPath ? path.basename(result.finalPath) : tempFile.originalName
			return NextResponse.json({
				success: true,
				filename: finalFilename,
				message: 'File saved to Downloads folder'
			})
		} else {
			return NextResponse.json(
				{ error: 'Failed to save file to Downloads folder' },
				{ status: 500 }
			)
		}
	} catch (error) {
		console.error('Move to downloads error:', error)
		return NextResponse.json(
			{ error: 'Invalid request data' },
			{ status: 400 }
		)
	}
} 