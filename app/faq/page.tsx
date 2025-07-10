import Header from "@/components/Header"
import Footer from "@/components/Footer"
import FAQ from "@/components/FAQ"

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="pt-16">
        <FAQ />
      </div>
      <Footer />
    </main>
  )
}
