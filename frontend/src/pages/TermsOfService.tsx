import { FileText, AlertTriangle, CheckCircle, Users, Shield } from "lucide-react";

const TermsOfService = () => {
  const sections = [
    {
      icon: Users,
      title: "Acceptance of Terms",
      content: `By accessing and using PriceTracker, you accept and agree to be bound by the terms
      and provision of this agreement. If you do not agree to abide by the above, please
      do not use this service.`
    },
    {
      icon: CheckCircle,
      title: "User Accounts",
      content: `You are responsible for maintaining the confidentiality of your account and password.
      You agree to accept responsibility for all activities that occur under your account
      or password. You must notify us immediately of any unauthorized use.`
    },
    {
      icon: Shield,
      title: "Acceptable Use",
      content: `You agree not to use the service to violate any local, state, national, or international
      law or regulation. You also agree not to transmit any material that is unlawful,
      harmful, threatening, abusive, or objectionable in any way.`
    },
    {
      icon: AlertTriangle,
      title: "Service Availability",
      content: `We strive to provide the best service possible, but we do not guarantee that the service
      will be uninterrupted or error-free. We reserve the right to modify or discontinue
      the service at any time without notice.`
    }
  ];

  const keyPoints = [
    "You must be at least 18 years old to use our service",
    "You are responsible for all activities under your account",
    "We reserve the right to terminate accounts that violate our terms",
    "Our service is provided 'as is' without warranties",
    "We are not liable for any indirect or consequential damages",
    "These terms may be updated without prior notice"
  ];

  return (
    <div className="min-h-screen" style={{ background: "#020617" }}>
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <FileText className="h-16 w-16 text-cyan-400 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-white mb-4">
              Terms of Service
            </h1>
            <p className="text-slate-400 text-lg">
              Last updated: January 15, 2024
            </p>
          </div>

          {/* Introduction */}
          <div className="mb-12 p-8 rounded-lg border border-cyan-400/10"
               style={{ background: "rgba(2, 6, 23, 0.5)" }}>
            <p className="text-slate-300 text-lg leading-relaxed">
              These Terms of Service ("Terms") govern your use of PriceTracker and our services.
              By using our platform, you agree to these terms. Please read them carefully before
              using our services.
            </p>
          </div>

          {/* Terms Sections */}
          <div className="space-y-8 mb-16">
            {sections.map((section, index) => (
              <div
                key={index}
                className="p-8 rounded-lg border border-cyan-400/10"
                style={{ background: "rgba(2, 6, 23, 0.5)" }}
              >
                <div className="flex items-start">
                  <section.icon className="h-8 w-8 text-cyan-400 mr-4 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">
                      {section.title}
                    </h3>
                    <p className="text-slate-300 leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Key Points */}
          <div className="mb-16">
            <h2 className="text-2xl font-semibold text-white mb-8">
              Key Points
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              {keyPoints.map((point, index) => (
                <div
                  key={index}
                  className="flex items-start p-4 rounded-lg border border-cyan-400/10"
                  style={{ background: "rgba(2, 6, 23, 0.5)" }}
                >
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-slate-300">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Limitation of Liability */}
          <div className="mb-16 p-8 rounded-lg border border-cyan-400/10"
               style={{ background: "rgba(2, 6, 23, 0.5)" }}>
            <h2 className="text-2xl font-semibold text-white mb-6">
              Limitation of Liability
            </h2>

            <div className="space-y-4 text-slate-300">
              <p>
                In no event shall PriceTracker, its directors, employees, or agents be liable for any
                indirect, incidental, special, consequential, or punitive damages, including without
                limitation, loss of profits, data, use, goodwill, or other intangible losses.
              </p>

              <p>
                Our total liability to you for all claims arising from or related to the service
                shall not exceed the amount paid by you, if any, for accessing the service.
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="text-center">
            <div className="p-8 rounded-lg border border-cyan-400/10 max-w-2xl mx-auto"
                 style={{ background: "rgba(2, 6, 23, 0.5)" }}>
              <h3 className="text-xl font-semibold text-white mb-4">
                Questions About These Terms?
              </h3>
              <p className="text-slate-300 mb-6">
                If you have any questions about these Terms of Service, please contact us:
              </p>

              <div className="space-y-2 text-slate-300">
                <p>
                  <strong className="text-white">Email:</strong> pricetrackr85@gmail.com
                </p>
                <p>
                  <strong className="text-white">Phone:</strong> +92 31653 65826
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
