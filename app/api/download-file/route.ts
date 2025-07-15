import { NextRequest, NextResponse } from 'next/server'
import { downloadToTemp } from '@/lib/download-service'
import { moveTempFileToDownloads, getTempFile } from '@/lib/temp-service'
import { z } from 'zod'
import path from 'path'
import os from 'os'

const downloadSchema = z.object({
	url: z.string().url(),
	format: z.enum(['MP3', 'MP4']),
})

const moveToDownloadsSchema = z.object({
	tempId: z.string(),
})

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
		
		// Start download to temp folder
		try {
			const tempId = await downloadToTemp(url, downloadId, format)
			
			return NextResponse.json({ 
				success: true, 
				downloadId,
				tempId,
				message: 'Download to temp started' 
			})
		} catch (error) {
			console.error('Download to temp failed:', error)
			return NextResponse.json(
				{ error: 'Download failed' },
				{ status: 500 }
			)
		}
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