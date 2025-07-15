import fs from 'fs'
import path from 'path'

// Temp folder path
const getTempPath = () => {
	return path.join(process.cwd(), 'temp')
}

// Interface for temp file metadata
interface TempFileInfo {
	id: string
	filePath: string
	originalName: string
	createdAt: Date
	cleanupTimeout: NodeJS.Timeout
}

// Store temp file info in memory (in production, consider using Redis or database)
const tempFiles = new Map<string, TempFileInfo>()

// Cleanup temp file after timeout
const cleanupTempFile = (tempId: string) => {
	const tempFile = tempFiles.get(tempId)
	if (!tempFile) return

	try {
		// Delete the physical file
		if (fs.existsSync(tempFile.filePath)) {
			fs.unlinkSync(tempFile.filePath)
			console.log(`Cleaned up temp file: ${tempFile.filePath}`)
		}
	} catch (error) {
		console.error(`Error cleaning up temp file ${tempFile.filePath}:`, error)
	}

	// Remove from memory
	tempFiles.delete(tempId)
}

// Helper function to generate unique filename if file already exists
const generateUniqueFilename = (filePath: string): string => {
	if (!fs.existsSync(filePath)) {
		return filePath
	}

	const dir = path.dirname(filePath)
	const ext = path.extname(filePath)
	const nameWithoutExt = path.basename(filePath, ext)

	let counter = 1
	let newPath: string

	do {
		const newName = `${nameWithoutExt} (${counter})${ext}`
		newPath = path.join(dir, newName)
		counter++
	} while (fs.existsSync(newPath))

	return newPath
}

export const createTempFile = (originalName: string, customTempId?: string): { tempId: string; tempPath: string } => {
	// Generate unique temp ID using custom ID if provided, otherwise generate new one
	const tempId = customTempId || `${Date.now()}_${Math.random().toString(36).substring(2)}`
	
	// Ensure temp directory exists
	const tempDir = getTempPath()
	if (!fs.existsSync(tempDir)) {
		fs.mkdirSync(tempDir, { recursive: true })
	}

	// Create temp file path
	const tempPath = path.join(tempDir, `${tempId}_${originalName}`)

	// Set cleanup timeout (60 seconds)
	const cleanupTimeout = setTimeout(() => {
		cleanupTempFile(tempId)
	}, 60 * 1000) // 60 seconds

	// Store temp file info
	tempFiles.set(tempId, {
		id: tempId,
		filePath: tempPath,
		originalName,
		createdAt: new Date(),
		cleanupTimeout
	})

	return { tempId, tempPath }
}

export const getTempFile = (tempId: string): TempFileInfo | null => {
	return tempFiles.get(tempId) || null
}

export const moveTempFileToDownloads = (tempId: string, downloadsPath: string): { success: boolean; finalPath?: string } => {
	const tempFile = tempFiles.get(tempId)
	if (!tempFile || !fs.existsSync(tempFile.filePath)) {
		return { success: false }
	}

	try {
		// Generate unique filename if file already exists
		const uniqueDownloadsPath = generateUniqueFilename(downloadsPath)
		
		// Move file to downloads folder
		fs.copyFileSync(tempFile.filePath, uniqueDownloadsPath)
		
		// Clear the cleanup timeout
		clearTimeout(tempFile.cleanupTimeout)
		
		// Clean up temp file
		cleanupTempFile(tempId)
		
		return { success: true, finalPath: uniqueDownloadsPath }
	} catch (error) {
		console.error(`Error moving temp file to downloads:`, error)
		return { success: false }
	}
}

export const cancelTempFile = (tempId: string): void => {
	const tempFile = tempFiles.get(tempId)
	if (tempFile) {
		clearTimeout(tempFile.cleanupTimeout)
		cleanupTempFile(tempId)
	}
}

// Clean up all expired temp files on startup
export const cleanupExpiredTempFiles = () => {
	const tempDir = getTempPath()
	if (!fs.existsSync(tempDir)) return

	try {
		const files = fs.readdirSync(tempDir)
		const now = Date.now()
		
		files.forEach(file => {
			const filePath = path.join(tempDir, file)
			const stats = fs.statSync(filePath)
			
			// Delete files older than 5 minutes (safety buffer)
			if (now - stats.mtime.getTime() > 5 * 60 * 1000) {
				try {
					fs.unlinkSync(filePath)
					console.log(`Cleaned up expired temp file: ${filePath}`)
				} catch (error) {
					console.error(`Error cleaning up expired file ${filePath}:`, error)
				}
			}
		})
	} catch (error) {
		console.error('Error cleaning up expired temp files:', error)
	}
}

// Initialize cleanup on module load
cleanupExpiredTempFiles() 