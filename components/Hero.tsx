"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Music, Play, Youtube, AlertCircle, ChevronDown } from "lucide-react"

export default function Hero() {
  const [url, setUrl] = useState("")
  const [error, setError] = useState("")
  const [isValid, setIsValid] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState("MP3")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const formatOptions = ["MP3", "MP4"]  // Simple format options array

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
  }

  const handleFormatSelect = (format: string) => {
    console.log('Selecting format:', format)
    setSelectedFormat(format)
    setIsDropdownOpen(false)
  }

  const toggleDropdown = () => {
    console.log('Toggle dropdown, current state:', isDropdownOpen)
    setIsDropdownOpen(!isDropdownOpen)
  }

  const handleDownload = () => {
    if (validateYouTubeUrl(url)) {
      // Download logic would go here
      console.log("Downloading:", { url, format: selectedFormat })
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
                className="flex h-16 items-center px-4 py-3 border-r border-gray-200 dark:border-gray-600 transition-colors"
              >
                <span className="text-base font-medium text-gray-700 dark:text-gray-300 mr-2 min-w-[40px]">
                  {selectedFormat}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
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
                            : "text-gray-700 dark:text-gray-300"
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
              className="flex-1 px-4 py-3 text-base bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border-none outline-none focus:ring-0 h-16"
            />

            {/* Download Button - Right side */}
            <Button
              onClick={handleDownload}
              disabled={!isValid}
              className={`h-16 px-8 py-2 whitespace-nowrap rounded-l-none transition-all ${
                isValid
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              }`}
            >
              DOWNLOAD
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
            {isValid && (
              <div className="flex items-center justify-center gap-1 text-sm text-green-600 dark:text-green-400">
                <span>✓ Valid YouTube URL</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
