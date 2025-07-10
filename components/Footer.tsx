export default function Footer() {
  const languages = [
    "English",
    "Deutsch",
    "Polski",
    "Français",
    "Español",
    "Ελληνικά",
    "Latvian",
    "Lithuanian",
    "Nederlands",
    "简体中文",
    "Italiano",
    "Svenska",
    "Slovenský",
    "Português",
    "Slovenščina",
    "Русский",
    "Dansk",
    "Suomi",
    "Български",
    "Čeština",
    "Eestlane",
    "Magyar",
    "Română",
    "日本語",
    "한국어",
    "Bahasa Indonesia",
  ]

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 sm:mb-0">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-sm transform rotate-45"></div>
            </div>
            <span className="text-xl font-bold">mvloader</span>
          </div>

          <p className="text-sm text-gray-400">Copyright © 2022 All Rights Reserved</p>
        </div>
      </div>
    </footer>
  )
}
