"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Calendar, Eye, Clock, Download } from "lucide-react"
import Image from "next/image"

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

interface DownloadProgress {
	downloadId: string
	progress: number
	status: 'downloading' | 'converting' | 'completed' | 'error'
	filename?: string
	error?: string
	tempId?: string
}

interface VideoPreviewProps {
	preview: VideoPreview
	onDownloadComplete: () => void
	onError: (error: string) => void
}

export function VideoPreview({ preview, onDownloadComplete, onError }: VideoPreviewProps) {
	const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'ready' | 'error' | 'success'>('idle')
	const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null)
	const [currentDownloadId, setCurrentDownloadId] = useState<string | null>(null)
	const [selectedFormat, setSelectedFormat] = useState<'MP3' | 'MP4' | null>(null)
	
	// Use useRef to track retry state without triggering useEffect re-runs
	const hasRetriedRef = useRef(false)
	const currentFormatRef = useRef<'MP3' | 'MP4' | null>(null)

	// Poll for download progress
	useEffect(() => {
		let interval: NodeJS.Timeout

		if (currentDownloadId && downloadState === 'downloading') {
			console.log('Starting polling for downloadId:', currentDownloadId)
			
			// Start polling immediately
			const pollProgress = async () => {
				try {
					const response = await fetch(`/api/progress?downloadId=${currentDownloadId}`)
					const progress: DownloadProgress = await response.json()
					
					console.log('Received progress:', progress)
					setDownloadProgress(progress)
					
					if (progress.status === 'completed') {
						setDownloadState('ready')
						hasRetriedRef.current = false // Reset retry flag on success
					} else if (progress.status === 'error') {
						// Check if this is a "Download not found" error and we haven't retried yet
						if (progress.error === 'Download not found' && !hasRetriedRef.current && currentFormatRef.current) {
							console.log('Download not found, retrying automatically...')
							hasRetriedRef.current = true
							// Clear current interval before retry
							if (interval) {
								clearInterval(interval)
							}
							// Restart the download automatically without showing error
							await retryDownload(currentFormatRef.current)
							return
						}
						
						// Show error for any other error type or if retry already attempted
						setDownloadState('error')
						hasRetriedRef.current = false // Reset retry flag
						onError(progress.error || 'Download failed')
					}
				} catch (err) {
					console.error('Error fetching progress:', err)
					setDownloadState('error')
					hasRetriedRef.current = false // Reset retry flag
					onError('Failed to get download progress')
				}
			}

			// Poll immediately first
			pollProgress()
			
			// Then set up interval for polling
			interval = setInterval(pollProgress, 500)
		}

		return () => {
			if (interval) {
				console.log('Clearing polling interval for downloadId:', currentDownloadId)
				clearInterval(interval)
			}
		}
	}, [currentDownloadId, downloadState, onError])

	const retryDownload = async (format: 'MP3' | 'MP4') => {
		console.log('Retrying download for format:', format)
		
		try {
			const response = await fetch('/api/download-file', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					url: `https://www.youtube.com/watch?v=${preview.videoId}`,
					format,
				}),
			})

			const data = await response.json()

			if (response.ok) {
				setCurrentDownloadId(data.downloadId)
				setDownloadProgress({
					downloadId: data.downloadId,
					progress: 0,
					status: 'downloading',
				})
			} else {
				// If retry fails, show the error
				setDownloadState('error')
				hasRetriedRef.current = false
				onError(data.error || 'Failed to start download')
			}
		} catch (err) {
			// If retry fails, show the error
			setDownloadState('error')
			hasRetriedRef.current = false
			onError('Failed to start download')
		}
	}

	const handleFormatDownload = async (format: 'MP3' | 'MP4') => {
		setSelectedFormat(format)
		currentFormatRef.current = format // Store format for retry logic
		setDownloadState('downloading')
		hasRetriedRef.current = false // Reset retry flag for new download
		setDownloadProgress({
			downloadId: '',
			progress: 0,
			status: 'downloading',
		})

		try {
			const response = await fetch('/api/download-file', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					url: `https://www.youtube.com/watch?v=${preview.videoId}`,
					format,
				}),
			})

			const data = await response.json()

			if (response.ok) {
				setCurrentDownloadId(data.downloadId)
				setDownloadProgress({
					downloadId: data.downloadId,
					progress: 0,
					status: 'downloading',
				})
			} else {
				setDownloadState('error')
				onError(data.error || 'Failed to start download')
			}
		} catch (err) {
			setDownloadState('error')
			onError('Failed to start download')
		}
	}

	const handleFinalDownload = async () => {
		if (!downloadProgress?.tempId) return

		try {
			// Create a download link that will trigger browser download
			const downloadUrl = `/api/download-file?tempId=${downloadProgress.tempId}`
			
			// Create a temporary anchor element to trigger download
			const link = document.createElement('a')
			link.href = downloadUrl
			link.style.display = 'none'
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)

			// Show success message briefly, then return to ready state for more downloads
			setDownloadState('success')
			
			// After a brief success message, return to ready state to allow downloading again
			setTimeout(() => {
				setDownloadState('ready')
			}, 2000)

		} catch (err) {
			onError('Failed to download file')
		}
	}

	const getStatusText = () => {
		if (!downloadProgress) return "Initializing..."
		
		switch (downloadProgress.status) {
			case 'downloading':
				if (downloadProgress.progress === 0) {
					return "Starting download..."
				}
				return "Downloading..."
			case 'converting':
				return "Converting..."
			case 'completed':
				return "Ready to download!"
			case 'error':
				return "Download failed"
			default:
				return "Processing..."
		}
	}

	return (
		<div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
			{/* Video thumbnail and info */}
			<div className="p-6">
				<div className="flex flex-col md:flex-row gap-4">
					{/* Thumbnail */}
					<div className="flex-shrink-0">
						<div className="relative w-full md:w-48 h-36 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
							{preview.thumbnail ? (
								<Image
									src={preview.thumbnail}
									alt={preview.title}
									fill
									className="object-cover"
									unoptimized
								/>
							) : (
								<div className="w-full h-full flex items-center justify-center text-gray-400">
									No thumbnail
								</div>
							)}
							{/* Duration overlay */}
							<div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
								{preview.duration}
							</div>
						</div>
					</div>

					{/* Video details */}
					<div className="flex-1 min-w-0 text-left">
						<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2">
							{preview.title}
						</h2>
						
						{/* Channel name */}
						<div className="mb-3">
							<span className="text-base font-medium text-gray-700 dark:text-gray-200">
								{preview.channelName}
							</span>
						</div>
						
						{/* Track details in column layout */}
						<div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
							<div className="flex items-center gap-2">
								<Eye className="w-4 h-4 text-gray-500" />
								<span>{preview.viewCount}</span>
							</div>
							
							<div className="flex items-center gap-2">
								<Calendar className="w-4 h-4 text-gray-500" />
								<span>{preview.publishDate}</span>
							</div>
							
							<div className="flex items-center gap-2">
								<Clock className="w-4 h-4 text-gray-500" />
								<span>{preview.duration}</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Download section */}
			<div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700 pt-4">
				{downloadState === 'idle' && (
					<div className="flex gap-3 justify-center">
						<Button
							onClick={() => handleFormatDownload('MP3')}
							className="flex-1 max-w-xs bg-blue-600 hover:bg-blue-700 text-white"
						>
							<Download className="w-4 h-4 mr-2" />
							Download MP3
						</Button>
						<Button
							onClick={() => handleFormatDownload('MP4')}
							className="flex-1 max-w-xs bg-red-600 hover:bg-red-700 text-white"
						>
							<Download className="w-4 h-4 mr-2" />
							Download MP4
						</Button>
					</div>
				)}

				{downloadState === 'downloading' && (
					<div className="text-center space-y-4">
						<div className="space-y-3">
							{/* Progress Bar */}
							<div className="w-full max-w-md mx-auto space-y-2">
								<Progress 
									value={downloadProgress?.progress || 0} 
									className="h-3 bg-gray-200 dark:bg-gray-700 transition-all duration-300"
								/>
								{/* Progress bar with animated background for converting state */}
								{downloadProgress?.status === 'converting' && (
									<div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full animate-pulse"></div>
								)}
							</div>
							
							{/* Progress Text and Percentage */}
							<div className="flex items-center justify-between max-w-md mx-auto text-sm">
								<span className="text-gray-600 dark:text-gray-400">
									{getStatusText()}
								</span>
								<span className="font-medium text-blue-600 dark:text-blue-400">
									{downloadProgress?.progress || 0}%
								</span>
							</div>
						</div>
						
						<div>
							<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
								Please wait while we prepare your {selectedFormat} file
							</p>
						</div>
					</div>
				)}

				{downloadState === 'ready' && downloadProgress && (
					<div className="text-center">
						<Button
							onClick={handleFinalDownload}
							className="bg-green-600 hover:bg-green-700 text-white px-8 py-2"
						>
							<Download className="w-4 h-4 mr-2" />
							DOWNLOAD
						</Button>
						<p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
							{selectedFormat} ready! Click to save to your Downloads folder.
						</p>
					</div>
				)}

				{downloadState === 'error' && (
					<div className="text-center">
						<p className="text-red-500 mb-3">Download failed. Please try again.</p>
						<Button
							onClick={() => {
								setDownloadState('idle')
								setDownloadProgress(null)
								setCurrentDownloadId(null)
								setSelectedFormat(null)
							}}
							variant="outline"
						>
							Try Again
						</Button>
					</div>
				)}

				{downloadState === 'success' && (
					<div className="text-center space-y-4">
						<div className="flex items-center justify-center mb-3">
							<div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-2">
								<div className="w-6 h-6 text-green-600 dark:text-green-300">✓</div>
							</div>
						</div>
						<div>
							<p className="text-green-600 dark:text-green-400 font-semibold mb-1">
								Download started successfully!
							</p>
							<p className="text-sm text-gray-600 dark:text-gray-300">
								{selectedFormat} file is being downloaded to your browser. Returning to download options...
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	)
} 