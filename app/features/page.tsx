import Header from "@/components/Header"
import Footer from "@/components/Footer"
import Features from "@/components/Features"

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="pt-16">
        <Features />
      </div>
      <Footer />
    </main>
  )
}
