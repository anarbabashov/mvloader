import { Card, CardContent } from "@/components/ui/card"

export default function About() {
  return (
    <section className="py-16 lg:py-24 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            What is <span className="text-blue-600">mvloader</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            mvloader is one of the most popular downloader tools on the internet with this tool, you can download and
            convert videos from almost anywhere on the internet, from YouTube, Twitter, and Facebook to Ok.ru, TikTok,
            and everything in between! Functionality-wise, it's very straightforward: The user is required to enter the
            page URL in the "URL" field, choose the format, and click download.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="bg-blue-600 text-white">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold mb-4">
                Experience Buffer-Free Entertainment With YouTube Video Downloader
              </h3>
              <p className="text-blue-100 mb-6">
                Are you tired of buffering interrupting your entertainment and a buffer-free experience for your
                favorite YouTube content. This user-friendly tool helps you to download videos effortlessly, eliminating
                the frustration of buffering.
              </p>
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-600 text-white">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold mb-4">Your One-Stop Solution to YouTube Video Downloading</h3>
              <p className="text-blue-100 mb-6">
                Tired of those annoying ads that keep popping during your YouTube binge? Well, say hello to
                uninterrupted entertainment with mvloader! Not only can you skip ads, but you can also download your
                favorite YouTube videos for free but also caters to those craving buffering-free entertainment.
              </p>
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
