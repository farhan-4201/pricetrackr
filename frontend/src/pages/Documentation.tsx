import { BookOpen, Code, Database, Zap, Shield, Users } from "lucide-react";

const Documentation = () => {
  const sections = [
    {
      icon: Code,
      title: "Getting Started",
      description: "Learn how to use PriceTracker effectively",
      articles: [
        "Quick Start Guide",
        "Creating Your First Price Alert",
        "Understanding Price History",
        "Managing Your Watchlist"
      ]
    },
    {
      icon: Database,
      title: "API Reference",
      description: "Integrate PriceTracker with your applications",
      articles: [
        "Authentication",
        "Price Data Endpoints",
        "Webhook Notifications",
        "Rate Limits"
      ]
    },
    {
      icon: Zap,
      title: "Advanced Features",
      description: "Make the most of our premium features",
      articles: [
        "Price Drop Alerts",
        "Market Analysis",
        "Bulk Price Tracking",
        "Export Data"
      ]
    },
    {
      icon: Shield,
      title: "Security & Privacy",
      description: "How we protect your data and privacy",
      articles: [
        "Data Encryption",
        "Privacy Policy",
        "GDPR Compliance",
        "Data Retention"
      ]
    }
  ];

  const popularArticles = [
    {
      title: "How to Track Products Across Multiple Stores",
      category: "Getting Started",
      readTime: "5 min read"
    },
    {
      title: "Setting Up Price Drop Notifications",
      category: "Features",
      readTime: "3 min read"
    },
    {
      title: "Understanding Price History Charts",
      category: "Analytics",
      readTime: "7 min read"
    },
    {
      title: "API Authentication Guide",
      category: "Developers",
      readTime: "10 min read"
    }
  ];

  return (
    <div className="min-h-screen" style={{ background: "#020617" }}>
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <BookOpen className="h-16 w-16 text-cyan-400 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-white mb-4">
              Documentation
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Everything you need to know about using PriceTracker effectively,
              from basic features to advanced integrations.
            </p>
          </div>

          {/* Popular Articles */}
          <div className="mb-16">
            <h2 className="text-2xl font-semibold text-white mb-8">
              Popular Articles
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {popularArticles.map((article, index) => (
                <div
                  key={index}
                  className="p-6 rounded-lg border border-cyan-400/10 hover:border-cyan-400/30 transition-all hover:scale-105 cursor-pointer"
                  style={{ background: "rgba(2, 6, 23, 0.5)" }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium text-white">
                      {article.title}
                    </h3>
                    <span className="text-xs text-slate-500">
                      {article.readTime}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-cyan-400 text-sm">
                      {article.category}
                    </span>
                    <button className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors">
                      Read →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Documentation Sections */}
          <div className="grid md:grid-cols-2 gap-8">
            {sections.map((section, index) => (
              <div
                key={index}
                className="p-6 rounded-lg border border-cyan-400/10 hover:border-cyan-400/30 transition-colors"
                style={{ background: "rgba(2, 6, 23, 0.5)" }}
              >
                <div className="flex items-center mb-4">
                  <section.icon className="h-8 w-8 text-cyan-400 mr-3" />
                  <h3 className="text-xl font-semibold text-white">
                    {section.title}
                  </h3>
                </div>

                <p className="text-slate-400 mb-6">
                  {section.description}
                </p>

                <div className="space-y-2">
                  {section.articles.map((article, articleIndex) => (
                    <button
                      key={articleIndex}
                      className="block w-full text-left text-slate-400 hover:text-cyan-400 transition-colors text-sm py-1"
                    >
                      {article}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Contact Support */}
          <div className="mt-16 text-center">
            <div className="p-8 rounded-lg border border-cyan-400/10"
                 style={{ background: "rgba(2, 6, 23, 0.5)" }}>
              <Users className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Need Help?
              </h3>
              <p className="text-slate-400 mb-4">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <button className="bg-cyan-400 hover:bg-cyan-300 text-slate-900 px-6 py-2 rounded-lg font-medium transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
