"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Calendar, Eye, Clock, Download, Loader2 } from "lucide-react"
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
	const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'ready' | 'error'>('idle')
	const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null)
	const [currentDownloadId, setCurrentDownloadId] = useState<string | null>(null)
	const [selectedFormat, setSelectedFormat] = useState<'MP3' | 'MP4' | null>(null)
	const [animatedProgress, setAnimatedProgress] = useState(0)

	// Animate progress for better UX
	useEffect(() => {
		if (downloadProgress) {
			const targetProgress = downloadProgress.progress
			
			const animate = () => {
				setAnimatedProgress(current => {
					if (current < targetProgress) {
						const increment = Math.min(3, targetProgress - current) // Animate at 3% per step
						const newProgress = current + increment
						if (newProgress < targetProgress) {
							setTimeout(animate, 50) // Update every 50ms for smooth animation
						}
						return newProgress
					}
					return current
				})
			}
			
			animate()
		}
	}, [downloadProgress?.progress]) // Only depend on the progress value

	// Poll for download progress
	useEffect(() => {
		let interval: NodeJS.Timeout

		if (currentDownloadId && downloadState === 'downloading') {
			// Start polling immediately
			const pollProgress = async () => {
				try {
					const response = await fetch(`/api/progress?downloadId=${currentDownloadId}`)
					const progress: DownloadProgress = await response.json()
					
					console.log('Received progress:', progress)
					setDownloadProgress(progress)
					
					if (progress.status === 'completed') {
						// Add a small delay before showing ready state to let animation finish
						setTimeout(() => setDownloadState('ready'), 500)
					} else if (progress.status === 'error') {
						setDownloadState('error')
						onError(progress.error || 'Download failed')
					}
				} catch (err) {
					console.error('Error fetching progress:', err)
					setDownloadState('error')
					onError('Failed to get download progress')
				}
			}

			// Poll immediately first
			pollProgress()
			
			// Then set up interval for more frequent polling
			interval = setInterval(pollProgress, 200) // Reduced from 500ms to 200ms for faster updates
		}

		return () => {
			if (interval) clearInterval(interval)
		}
	}, [currentDownloadId, downloadState, onError])

	const handleFormatDownload = async (format: 'MP3' | 'MP4') => {
		setSelectedFormat(format)
		setDownloadState('downloading')
		setAnimatedProgress(0) // Reset animated progress
		// Set initial progress immediately to show the progress bar
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
				// Update progress with actual downloadId but keep at 0 to start animation
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
			const response = await fetch('/api/download-file', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					tempId: downloadProgress.tempId,
				}),
			})

			const data = await response.json()

			if (response.ok) {
				// Reset state and notify parent
				setDownloadState('idle')
				setDownloadProgress(null)
				setCurrentDownloadId(null)
				setSelectedFormat(null)
				setAnimatedProgress(0)
				onDownloadComplete()
			} else {
				onError(data.error || 'Failed to save file')
			}
		} catch (err) {
			onError('Failed to save file')
		}
	}

	const getStatusText = () => {
		if (!downloadProgress) return ""
		
		switch (downloadProgress.status) {
			case 'downloading':
				return "Hang tight—we're baking!"
			case 'converting':
				return "Converting to high quality..."
			case 'completed':
				return "Ready to download!"
			case 'error':
				return "Download failed"
			default:
				return ""
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
					<div className="flex-1 min-w-0">
						<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
							{preview.title}
						</h2>
						
						<div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
							<div className="flex items-center gap-2">
								<span className="font-medium">{preview.channelName}</span>
							</div>
							
							<div className="flex items-center gap-4 flex-wrap">
								<div className="flex items-center gap-1">
									<Eye className="w-4 h-4" />
									<span>{preview.viewCount}</span>
								</div>
								
								<div className="flex items-center gap-1">
									<Calendar className="w-4 h-4" />
									<span>{preview.publishDate}</span>
								</div>
								
								<div className="flex items-center gap-1">
									<Clock className="w-4 h-4" />
									<span>{preview.duration}</span>
								</div>
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

				{downloadState === 'downloading' && downloadProgress && (
					<div className="space-y-3">
						<div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
							<span>{getStatusText()}</span>
							<span>{Math.round(animatedProgress)}%</span>
						</div>
						<Progress value={animatedProgress} className="h-2" />
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
								setAnimatedProgress(0)
							}}
							variant="outline"
						>
							Try Again
						</Button>
					</div>
				)}
			</div>
		</div>
	)
} 