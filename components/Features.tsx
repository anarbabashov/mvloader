import { Card, CardContent } from "@/components/ui/card"
import { Download, DollarSign, Zap, Smartphone, Shield, Clock } from "lucide-react"

export default function Features() {
  const features = [
    {
      icon: Download,
      title: "No Download Limit",
      description: "You can download all content you want without limits.",
    },
    {
      icon: DollarSign,
      title: "Downloads At No Cost",
      description: "You can convert Video and Audio content and download it for free here.",
    },
    {
      icon: Zap,
      title: "The Best Speeds",
      description: "Our platform converts Audio and Video in seconds.",
    },
    {
      icon: Smartphone,
      title: "Easy to Use",
      description: "You can convert and download content using our tool with a few clicks.",
    },
    {
      icon: Shield,
      title: "No Need For Apps",
      description: "Since our tool is online, you can use it without having to install anything on your device.",
    },
    {
      icon: Clock,
      title: "Well Secured",
      description: "Our website is very well secured. We have developed this website with user security in mind.",
    },
  ]

  return (
    <section className="py-16 lg:py-24 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-sm font-semibold text-blue-600 mb-2">Features</h2>
          <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">What Makes Us Special</h3>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="bg-white dark:bg-gray-900 hover:shadow-lg transition-shadow border-gray-200 dark:border-gray-700"
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{feature.title}</h4>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
