"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function FAQ() {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  const faqData = [
    {
      category: "YouTubeDownloader: FAQs",
      questions: [
        {
          question: "Are there any subscription plans, or is it a one-time purchase?",
          answer: "Our service is completely free to use. No subscription plans or one-time purchases required.",
        },
        {
          question: "Can the downloader be used without providing personal information?",
          answer:
            "Yes, you can use our downloader without providing any personal information. We respect your privacy.",
        },
        {
          question: "Can the downloader be used without providing personal information?",
          answer:
            "Yes, you can use our downloader without providing any personal information. We respect your privacy.",
        },
      ],
    },
    {
      category: "mvloader: FAQs",
      questions: [
        {
          question: "Are there any subscription plans, or is it a one-time purchase?",
          answer: "Our service is completely free to use. No subscription plans or one-time purchases required.",
        },
        {
          question: "Can the downloader be used without providing personal information?",
          answer:
            "Yes, you can use our downloader without providing any personal information. We respect your privacy.",
        },
        {
          question: "Can the downloader be used without providing personal information?",
          answer:
            "Yes, you can use our downloader without providing any personal information. We respect your privacy.",
        },
      ],
    },
  ]

  return (
    <section className="py-16 lg:py-24 bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-sm font-semibold text-blue-600 mb-2">FAQ</h2>
          <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h3>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {faqData.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <div className="flex items-center space-x-2 mb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{category.category}</h4>
                <HelpCircle className="w-5 h-5 text-blue-600" />
              </div>

              <div className="space-y-4">
                {category.questions.map((item, itemIndex) => {
                  const globalIndex = categoryIndex * 10 + itemIndex
                  const isOpen = openItems.includes(globalIndex)

                  return (
                    <Card
                      key={itemIndex}
                      className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    >
                      <CardContent className="p-0">
                        <button
                          onClick={() => toggleItem(globalIndex)}
                          className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <span className="font-medium text-gray-900 dark:text-white pr-4">{item.question}</span>
                          <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            {isOpen ? (
                              <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            )}
                          </div>
                        </button>

                        {isOpen && (
                          <div className="px-4 pb-4">
                            <p className="text-gray-600 dark:text-gray-300">{item.answer}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
