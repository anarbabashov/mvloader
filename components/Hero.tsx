"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Music, Play, Youtube, AlertCircle, ChevronDown, Download, Loader2 } from "lucide-react"

interface DownloadProgress {
  downloadId: string
  progress: number
  status: 'downloading' | 'converting' | 'completed' | 'error'
  filename?: string
  error?: string
}

export default function Hero() {
  const [url, setUrl] = useState("")
  const [error, setError] = useState("")
  const [isValid, setIsValid] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState("MP3")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null)
  const [currentDownloadId, setCurrentDownloadId] = useState<string | null>(null)

  const formatOptions = ["MP3", "MP4"]

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

  // Poll for download progress
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (currentDownloadId && isDownloading) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/progress?downloadId=${currentDownloadId}`)
          const progress: DownloadProgress = await response.json()
          
          setDownloadProgress(progress)
          
          if (progress.status === 'completed') {
            setIsDownloading(false)
            // Show success message instead of auto-download
            setError("")
          } else if (progress.status === 'error') {
            setIsDownloading(false)
            setError(progress.error || 'Download failed')
          }
        } catch (err) {
          console.error('Error fetching progress:', err)
          setError('Failed to get download progress')
          setIsDownloading(false)
        }
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [currentDownloadId, isDownloading])

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
    // Reset download state when URL changes
    setDownloadProgress(null)
    setCurrentDownloadId(null)
  }

  const handleFormatSelect = (format: string) => {
    setSelectedFormat(format)
    setIsDropdownOpen(false)
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const handleDownload = async () => {
    if (!validateYouTubeUrl(url)) return

    setIsDownloading(true)
    setDownloadProgress(null)
    setError("")

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          format: selectedFormat,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setCurrentDownloadId(data.downloadId)
      } else {
        setError(data.error || 'Failed to start download')
        setIsDownloading(false)
      }
    } catch (err) {
      setError('Failed to start download')
      setIsDownloading(false)
    }
  }

  const getStatusText = () => {
    if (!downloadProgress) return ""
    
    switch (downloadProgress.status) {
      case 'downloading':
        return "Downloading from YouTube..."
      case 'converting':
        return "Converting to high quality..."
      case 'completed':
        return "Download completed!"
      case 'error':
        return "Download failed"
      default:
        return ""
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest(".format-input-group")) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isDropdownOpen])

  return (
    <section className="bg-white dark:bg-gray-900 py-16 lg:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Decorative elements */}
        <div className="flex justify-center items-center space-x-8 mb-8">
          <div className="w-8 h-8 bg-blue-500 rounded transform rotate-45"></div>
          <Music className="w-8 h-8 text-red-500" />
          <Play className="w-8 h-8 text-blue-500" />
          <Youtube className="w-8 h-8 text-red-600" />
        </div>

        {/* Main heading */}
        <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          YouTube Video <span className="underline decoration-blue-500 decoration-4">Downloader</span>
        </h1>

        {/* Description */}
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
          Try this unique tool for quick, hassle-free downloads from YouTube. Transform your offline video collection
          with this reliable and efficient downloader.
        </p>

        {/* Download form */}
        <div className="mb-8 flex flex-col items-center relative">
          <div
            className={`format-input-group flex w-full max-w-2xl items-stretch rounded-2xl border-2 bg-white dark:bg-gray-700 shadow-lg transition-colors
              ${
                error && url.trim() !== ""
                  ? "border-red-300 dark:border-red-600 focus-within:border-red-500 dark:focus-within:border-red-400"
                  : isValid
                    ? "border-green-300 dark:border-green-600 focus-within:border-green-500 dark:focus-within:border-green-400"
                    : "border-gray-300 dark:border-gray-600 focus-within:border-blue-500 dark:focus-within:border-blue-400"
              }
            `}
          >
            {/* Format Selector - Left side */}
            <div className="relative">
              <button
                type="button"
                onClick={toggleDropdown}
                disabled={isDownloading}
                className="flex h-16 items-center px-4 py-3 border-r border-gray-200 dark:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-base font-medium text-gray-700 dark:text-gray-300 mr-2 min-w-[40px]">
                  {selectedFormat}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && !isDownloading && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50 min-w-[100px] overflow-hidden">
                  <div className="py-1">
                    {formatOptions.map((format) => (
                      <button
                        key={format}
                        type="button"
                        onClick={() => handleFormatSelect(format)}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                          selectedFormat === format
                            ? "bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                        }`}
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* URL Input - Middle */}
            <input
              type="url"
              placeholder="Please paste the URL"
              value={url}
              onChange={handleUrlChange}
              disabled={isDownloading}
              className="flex-1 px-4 py-3 text-base bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border-none outline-none focus:ring-0 h-16 disabled:opacity-50 disabled:cursor-not-allowed"
            />

            {/* Download Button - Right side */}
            <Button
              onClick={handleDownload}
              disabled={!isValid || isDownloading}
              className={`h-16 px-8 py-2 whitespace-nowrap rounded-l-none transition-all ${
                isValid && !isDownloading
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              }`}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  DOWNLOADING
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  DOWNLOAD
                </>
              )}
            </Button>
          </div>

          {/* Progress Bar */}
          {isDownloading && downloadProgress && (
            <div className="w-full max-w-2xl mt-4">
              <div className="mb-2 flex justify-between text-sm text-gray-600 dark:text-gray-300">
                <span>{getStatusText()}</span>
                <span>{downloadProgress.progress}%</span>
              </div>
              <Progress value={downloadProgress.progress} className="h-2" />
            </div>
          )}

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
            {isValid && !isDownloading && !error && (
              <div className="flex items-center justify-center gap-1 text-sm text-green-600 dark:text-green-400">
                <span>✓ Valid YouTube URL</span>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
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
            <p className="text-gray-600 dark:text-gray-300">Download videos in the highest available quality</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Download className="w-6 h-6 text-green-600 dark:text-green-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Fast Download</h3>
            <p className="text-gray-600 dark:text-gray-300">Quick processing with real-time progress tracking</p>
          </div>
        </div>
      </div>
    </section>
  )
}
