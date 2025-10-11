import { Cookie, Settings, Shield, Info, Trash2 } from "lucide-react";

const CookiePolicy = () => {
  const cookieTypes = [
    {
      icon: Settings,
      title: "Essential Cookies",
      description: "Required for basic website functionality",
      examples: ["Session management", "Security features", "Basic site navigation"],
      required: true
    },
    {
      icon: Info,
      title: "Analytics Cookies",
      description: "Help us understand how visitors use our site",
      examples: ["Page views", "User journey tracking", "Performance metrics"],
      required: false
    },
    {
      icon: Settings,
      title: "Functional Cookies",
      description: "Remember your preferences and settings",
      examples: ["Language preferences", "Theme settings", "Layout customization"],
      required: false
    },
    {
      icon: Shield,
      title: "Marketing Cookies",
      description: "Used to deliver relevant advertisements",
      examples: ["Personalized ads", "Retargeting", "Social media integration"],
      required: false
    }
  ];

  const managementSteps = [
    {
      step: "1",
      title: "Browser Settings",
      description: "Access your browser's cookie settings through the menu"
    },
    {
      step: "2",
      title: "Cookie Preferences",
      description: "Choose which types of cookies you want to allow or block"
    },
    {
      step: "3",
      title: "Save Changes",
      description: "Apply your settings and refresh the page"
    },
    {
      step: "4",
      title: "Clear Existing Cookies",
      description: "Remove existing cookies if needed for immediate effect"
    }
  ];

  return (
    <div className="min-h-screen" style={{ background: "#020617" }}>
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <Cookie className="h-16 w-16 text-cyan-400 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-white mb-4">
              Cookie Policy
            </h1>
            <p className="text-slate-400 text-lg">
              Last updated: January 15, 2024
            </p>
          </div>

          {/* Introduction */}
          <div className="mb-12 p-8 rounded-lg border border-cyan-400/10"
               style={{ background: "rgba(2, 6, 23, 0.5)" }}>
            <p className="text-slate-300 text-lg leading-relaxed">
              This Cookie Policy explains how PriceTracker uses cookies and similar technologies
              to enhance your browsing experience, analyze site traffic, and personalize content.
              By using our website, you consent to the use of cookies as described in this policy.
            </p>
          </div>

          {/* What are Cookies */}
          <div className="mb-16 p-8 rounded-lg border border-cyan-400/10"
               style={{ background: "rgba(2, 6, 23, 0.5)" }}>
            <h2 className="text-2xl font-semibold text-white mb-6">
              What Are Cookies?
            </h2>

            <p className="text-slate-300 leading-relaxed">
              Cookies are small text files that are placed on your computer or mobile device when
              you visit a website. They are widely used to make websites work more efficiently,
              as well as to provide information to the owners of the site. Cookies can be "session cookies"
              (temporary) or "persistent cookies" (stored for a longer period).
            </p>
          </div>

          {/* Cookie Types */}
          <div className="mb-16">
            <h2 className="text-2xl font-semibold text-white mb-8">
              Types of Cookies We Use
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              {cookieTypes.map((type, index) => (
                <div
                  key={index}
                  className="p-6 rounded-lg border border-cyan-400/10"
                  style={{ background: "rgba(2, 6, 23, 0.5)" }}
                >
                  <div className="flex items-start mb-4">
                    <type.icon className="h-6 w-6 text-cyan-400 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-medium text-white mb-2">
                        {type.title}
                        {type.required && (
                          <span className="ml-2 text-xs bg-green-400/20 text-green-400 px-2 py-1 rounded">
                            Required
                          </span>
                        )}
                      </h3>
                      <p className="text-slate-400 text-sm mb-3">
                        {type.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {type.examples.map((example, exampleIndex) => (
                      <p key={exampleIndex} className="text-slate-400 text-sm">
                        • {example}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cookie Management */}
          <div className="mb-16">
            <h2 className="text-2xl font-semibold text-white mb-8 flex items-center">
              <Settings className="h-6 w-6 text-cyan-400 mr-3" />
              Managing Your Cookie Preferences
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {managementSteps.map((step, index) => (
                <div
                  key={index}
                  className="p-6 rounded-lg border border-cyan-400/10 text-center"
                  style={{ background: "rgba(2, 6, 23, 0.5)" }}
                >
                  <div className="w-8 h-8 bg-cyan-400 text-slate-900 rounded-full flex items-center justify-center font-bold mx-auto mb-3">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Browser Specific Instructions */}
          <div className="mb-16 p-8 rounded-lg border border-cyan-400/10"
               style={{ background: "rgba(2, 6, 23, 0.5)" }}>
            <h2 className="text-2xl font-semibold text-white mb-6">
              Browser-Specific Instructions
            </h2>

            <div className="grid md:grid-cols-2 gap-6 text-slate-300">
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Desktop Browsers</h3>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>Chrome:</strong> Settings → Privacy and security → Cookies</li>
                  <li>• <strong>Firefox:</strong> Preferences → Privacy & Security → Cookies</li>
                  <li>• <strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
                  <li>• <strong>Edge:</strong> Settings → Cookies and site permissions</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-white mb-3">Mobile Browsers</h3>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>iOS Safari:</strong> Settings → Safari → Block All Cookies</li>
                  <li>• <strong>Chrome Mobile:</strong> Settings → Site settings → Cookies</li>
                  <li>• <strong>Firefox Mobile:</strong> Settings → Privacy → Cookies</li>
                  <li>• <strong>Samsung Internet:</strong> Settings → Privacy → Block cookies</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="text-center">
            <div className="p-8 rounded-lg border border-cyan-400/10 max-w-2xl mx-auto"
                 style={{ background: "rgba(2, 6, 23, 0.5)" }}>
              <Trash2 className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-4">
                Questions About Cookies?
              </h3>
              <p className="text-slate-300 mb-6">
                If you have any questions about our use of cookies or this policy,
                please contact us:
              </p>

              <div className="space-y-2 text-slate-300">
                <p>
                  <strong className="text-white">Email:</strong> pricetrackr85@gmail.com
                </p>
                <p>
                  <strong className="text-white">Phone:</strong> +92 316 5365826
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
