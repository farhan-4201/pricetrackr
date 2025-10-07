import { HelpCircle, MessageCircle, BookOpen, Phone, Mail } from "lucide-react";

const HelpCenter = () => {
  const faqs = [
    {
      question: "How do I track a product?",
      answer: "Simply search for any product using our search bar, and click the 'Track' button to start monitoring price changes."
    },
    {
      question: "How often are prices updated?",
      answer: "We check prices multiple times per day across all supported marketplaces to ensure you get the most current information."
    },
    {
      question: "Can I track products from multiple stores?",
      answer: "Yes! Our platform compares prices from Daraz, PriceOye, Telemart, and other major Pakistani marketplaces."
    },
    {
      question: "How do I get notified of price drops?",
      answer: "Set up notifications in your dashboard to receive alerts when prices drop below your desired threshold."
    }
  ];

  const supportOptions = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Get instant help from our support team",
      action: "Start Chat"
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us an email and we'll respond within 24 hours",
      action: "Send Email"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak directly with our support specialists",
      action: "Call Now"
    }
  ];

  return (
    <div className="min-h-screen" style={{ background: "#020617" }}>
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <HelpCircle className="h-16 w-16 text-cyan-400 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-white mb-4">
              Help Center
            </h1>
            <p className="text-slate-400 text-lg">
              Find answers to common questions and get the help you need
            </p>
          </div>

          {/* FAQ Section */}
          <div className="mb-16">
            <h2 className="text-2xl font-semibold text-white mb-8 flex items-center">
              <BookOpen className="h-6 w-6 text-cyan-400 mr-3" />
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="p-6 rounded-lg border border-cyan-400/10 hover:border-cyan-400/30 transition-colors"
                  style={{ background: "rgba(2, 6, 23, 0.5)" }}
                >
                  <h3 className="text-lg font-medium text-white mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-slate-400">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Support Options */}
          <div>
            <h2 className="text-2xl font-semibold text-white mb-8">
              Need More Help?
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {supportOptions.map((option, index) => (
                <div
                  key={index}
                  className="p-6 rounded-lg border border-cyan-400/10 hover:border-cyan-400/30 transition-all hover:scale-105 cursor-pointer"
                  style={{ background: "rgba(2, 6, 23, 0.5)" }}
                >
                  <option.icon className="h-8 w-8 text-cyan-400 mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    {option.title}
                  </h3>
                  <p className="text-slate-400 text-sm mb-4">
                    {option.description}
                  </p>
                  <button className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors">
                    {option.action} →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
