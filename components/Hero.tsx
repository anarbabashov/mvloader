"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Music, Play, Youtube, AlertCircle, Loader2 } from "lucide-react"
import { VideoPreview } from "./VideoPreview"

interface VideoPreviewData {
	title: string
	description: string
	thumbnail: string
	channelName: string
	publishDate: string
	duration: string
	viewCount: string
	videoId: string
}

export function Hero() {
	const [url, setUrl] = useState("")
	const [isValid, setIsValid] = useState(false)
	const [error, setError] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const [videoPreview, setVideoPreview] = useState<VideoPreviewData | null>(null)

	// Validate YouTube URL
	const validateYouTubeUrl = (url: string) => {
		if (!url.trim()) {
			setError("Please paste the URL")
			setIsValid(false)
			return false
		}

		const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)/i

		if (!youtubeRegex.test(url)) {
			setError("Please enter a valid YouTube URL")
			setIsValid(false)
			return false
		}

		setError("")
		setIsValid(true)
		return true
	}

	// Validate on URL change
	useEffect(() => {
		if (url.trim() === "") {
			setError("Please paste the URL")
			setIsValid(false)
		} else {
			validateYouTubeUrl(url)
		}
	}, [url])

	const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUrl(e.target.value)
		// Reset preview when URL changes
		setVideoPreview(null)
	}

	const handleStart = async () => {
		if (!validateYouTubeUrl(url)) return

		setIsLoading(true)
		setError("")

		try {
			const response = await fetch('/api/preview', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ url }),
			})

			const data = await response.json()

			if (response.ok) {
				setVideoPreview(data.preview)
			} else {
				setError(data.error || 'Failed to fetch video information')
			}
		} catch (err) {
			setError('Failed to fetch video information')
		} finally {
			setIsLoading(false)
		}
	}

	const handleDownloadComplete = () => {
		// Reset to initial state
		setUrl("")
		setVideoPreview(null)
		setError("")
		setIsValid(false)
	}

	const handlePreviewError = (error: string) => {
		setError(error)
	}

	return (
		<section className="bg-white dark:bg-gray-900 py-16 lg:py-24">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
				{/* Decorative elements */}
				<div className="flex justify-center items-center gap-4 mb-8">
					<div className="w-8 h-8 bg-blue-500 rounded transform rotate-45"></div>
					<Music className="w-8 h-8 text-red-500" />
					<Play className="w-8 h-8 text-blue-500" />
					<Youtube className="w-8 h-8 text-red-600" />
				</div>

				{/* Main heading */}
				<h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
					YouTube Video/Audio <span className="underline decoration-blue-500 decoration-4">Downloader</span>
				</h1>

				{/* Description */}
				<p className="text-lg text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
					Try this unique tool for quick, hassle-free downloads from YouTube. Transform your offline video collection
					with this reliable and efficient downloader.
				</p>

				{/* Main form - only show if no preview */}
				{!videoPreview && (
					<div className="mb-8 flex flex-col items-center relative">
						<div
							className={`flex w-full max-w-2xl items-stretch rounded-2xl border-2 bg-white dark:bg-gray-700 shadow-lg transition-colors
								${
									error && url.trim() !== ""
										? "border-red-300 dark:border-red-600 focus-within:border-red-500 dark:focus-within:border-red-400"
										: isValid
											? "border-green-300 dark:border-green-600 focus-within:border-green-500 dark:focus-within:border-green-400"
											: "border-gray-300 dark:border-gray-600 focus-within:border-blue-500 dark:focus-within:border-blue-400"
								}
							`}
						>
							{/* URL Input */}
							<input
								type="url"
								placeholder="Please paste the YouTube URL"
								value={url}
								onChange={handleUrlChange}
								disabled={isLoading}
								className="flex-1 px-6 py-4 text-base bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border-none outline-none focus:ring-0 h-16 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-2xl"
							/>

							{/* Start Button */}
							<Button
								onClick={handleStart}
								disabled={!isValid || isLoading}
								className={`h-16 px-8 py-2 whitespace-nowrap rounded-l-none rounded-r-2xl transition-all ${
									isValid && !isLoading
										? "bg-blue-600 hover:bg-blue-700 text-white"
										: "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
								}`}
							>
								{isLoading ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										LOADING
									</>
								) : (
									<>
										START
									</>
								)}
							</Button>
						</div>

						{/* Error/Helper Message */}
						<div className="mt-4 text-center">
							{error && (
								<div className="flex items-center justify-center gap-1 text-sm">
									{url.trim() === "" ? (
										<span className="text-gray-500 dark:text-gray-400">{error}</span>
									) : (
										<>
											<AlertCircle className="w-4 h-4 text-red-500" />
											<span className="text-red-500">{error}</span>
										</>
									)}
								</div>
							)}
							{isValid && !isLoading && !error && (
								<div className="flex items-center justify-center gap-1 text-sm text-green-600 dark:text-green-400">
									<span>✓ Valid YouTube URL</span>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Video Preview */}
				{videoPreview && (
					<div className="mb-8">
						<VideoPreview
							preview={videoPreview}
							onDownloadComplete={handleDownloadComplete}
							onError={handlePreviewError}
						/>
						
						{/* Reset button */}
						<div className="mt-6">
							<Button
								onClick={() => {
									setVideoPreview(null)
									setUrl("")
									setError("")
									setIsValid(false)
								}}
								variant="outline"
								className="text-gray-600 dark:text-gray-300"
							>
								Try Another Video
							</Button>
						</div>
					</div>
				)}

				{/* Features - only show if no preview */}
				{!videoPreview && (
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
						<div className="text-center">
							<div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
								<Music className="w-6 h-6 text-blue-600 dark:text-blue-300" />
							</div>
							<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">High Quality Audio</h3>
							<p className="text-gray-600 dark:text-gray-300">Download MP3 files in 320kbps quality</p>
						</div>
						<div className="text-center">
							<div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mx-auto mb-4">
								<Play className="w-6 h-6 text-red-600 dark:text-red-300" />
							</div>
							<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">HD Video</h3>
							<p className="text-gray-600 dark:text-gray-300">Save videos in MP4 format with original quality</p>
						</div>
						<div className="text-center">
							<div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-4">
								<Youtube className="w-6 h-6 text-green-600 dark:text-green-300" />
							</div>
							<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Fast & Free</h3>
							<p className="text-gray-600 dark:text-gray-300">Quick downloads with no registration required</p>
						</div>
					</div>
				)}
			</div>
		</section>
	)
}
