import { Code2, Key, Database, Webhook, Zap, Shield } from "lucide-react";

const API = () => {
  const endpoints = [
    {
      method: "GET",
      path: "/api/v1/products/search",
      description: "Search for products across all marketplaces",
      params: ["q (string) - Search query", "limit (number) - Results limit (default: 20)"]
    },
    {
      method: "GET",
      path: "/api/v1/products/{id}",
      description: "Get detailed product information",
      params: ["id (string) - Product ID"]
    },
    {
      method: "GET",
      path: "/api/v1/products/{id}/history",
      description: "Get price history for a specific product",
      params: ["id (string) - Product ID", "days (number) - Days to look back (default: 30)"]
    },
    {
      method: "POST",
      path: "/api/v1/watchlist",
      description: "Add product to watchlist",
      params: ["productId (string) - Product ID", "targetPrice (number) - Price threshold"]
    }
  ];

  const features = [
    {
      icon: Zap,
      title: "Real-time Data",
      description: "Get up-to-date pricing information from all major Pakistani marketplaces"
    },
    {
      icon: Database,
      title: "Historical Data",
      description: "Access comprehensive price history and trend analysis"
    },
    {
      icon: Webhook,
      title: "Webhook Support",
      description: "Receive instant notifications when prices change"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with 99.9% uptime guarantee"
    }
  ];

  const codeExamples = [
    {
      language: "curl",
      code: `curl -X GET "https://api.pricetracker.com/v1/products/search?q=iPhone&limit=10" \\
  -H "Authorization: Bearer YOUR_API_KEY"`
    },
    {
      language: "javascript",
      code: `const response = await fetch('https://api.pricetracker.com/v1/products/search?q=iPhone&limit=10', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});

const data = await response.json();`
    },
    {
      language: "python",
      code: `import requests

response = requests.get(
    'https://api.pricetracker.com/v1/products/search',
    headers={'Authorization': 'Bearer YOUR_API_KEY'},
    params={'q': 'iPhone', 'limit': 10}
)

data = response.json()`
    }
  ];

  return (
    <div className="min-h-screen" style={{ background: "#020617" }}>
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <Code2 className="h-16 w-16 text-cyan-400 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-white mb-4">
              API Documentation
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Integrate PriceTracker with your applications using our powerful REST API.
              Get real-time pricing data from all major Pakistani marketplaces.
            </p>
          </div>

          {/* API Features */}
          <div className="mb-16">
            <h2 className="text-2xl font-semibold text-white mb-8 text-center">
              Why Use Our API?
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="p-6 rounded-lg border border-cyan-400/10 hover:border-cyan-400/30 transition-colors text-center"
                  style={{ background: "rgba(2, 6, 23, 0.5)" }}
                >
                  <feature.icon className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* API Endpoints */}
          <div className="mb-16">
            <h2 className="text-2xl font-semibold text-white mb-8">
              API Endpoints
            </h2>

            <div className="space-y-6">
              {endpoints.map((endpoint, index) => (
                <div
                  key={index}
                  className="p-6 rounded-lg border border-cyan-400/10"
                  style={{ background: "rgba(2, 6, 23, 0.5)" }}
                >
                  <div className="flex items-center mb-4">
                    <span className={`px-3 py-1 rounded text-sm font-medium mr-3 ${
                      endpoint.method === 'GET' ? 'bg-green-400/20 text-green-400' :
                      endpoint.method === 'POST' ? 'bg-blue-400/20 text-blue-400' :
                      'bg-purple-400/20 text-purple-400'
                    }`}>
                      {endpoint.method}
                    </span>
                    <code className="text-cyan-400 font-mono">
                      {endpoint.path}
                    </code>
                  </div>

                  <p className="text-slate-400 mb-4">
                    {endpoint.description}
                  </p>

                  <div>
                    <h4 className="text-white font-medium mb-2">Parameters:</h4>
                    <ul className="space-y-1">
                      {endpoint.params.map((param, paramIndex) => (
                        <li key={paramIndex} className="text-slate-400 text-sm">
                          • {param}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Code Examples */}
          <div className="mb-16">
            <h2 className="text-2xl font-semibold text-white mb-8">
              Code Examples
            </h2>

            <div className="space-y-6">
              {codeExamples.map((example, index) => (
                <div
                  key={index}
                  className="p-6 rounded-lg border border-cyan-400/10"
                  style={{ background: "rgba(2, 6, 23, 0.5)" }}
                >
                  <div className="flex items-center mb-4">
                    <Code2 className="h-5 w-5 text-cyan-400 mr-2" />
                    <span className="text-white font-medium">
                      {example.language.charAt(0).toUpperCase() + example.language.slice(1)}
                    </span>
                  </div>
                  <pre className="text-slate-300 text-sm overflow-x-auto">
                    <code>{example.code}</code>
                  </pre>
                </div>
              ))}
            </div>
          </div>

          {/* Get Started */}
          <div className="text-center">
            <div className="p-8 rounded-lg border border-cyan-400/10"
                 style={{ background: "rgba(2, 6, 23, 0.5)" }}>
              <Key className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Get Your API Key
              </h3>
              <p className="text-slate-400 mb-6">
                Sign up for a free account to get your API key and start building amazing applications.
              </p>
              <div className="flex justify-center">
                <button className="bg-cyan-400 hover:bg-cyan-300 text-slate-900 px-6 py-2 rounded-lg font-medium transition-colors">
                  Get API Key
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default API;
