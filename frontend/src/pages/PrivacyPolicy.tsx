import { Shield, Eye, Lock, Database, Users, Mail } from "lucide-react";

const PrivacyPolicy = () => {
  const sections = [
    {
      icon: Eye,
      title: "Information We Collect",
      content: `We collect information you provide directly to us, such as when you create an account,
      use our services, or contact us for support. This may include your name, email address,
      and any other information you choose to provide.`
    },
    {
      icon: Database,
      title: "How We Use Your Information",
      content: `We use the information we collect to provide, maintain, and improve our services,
      process transactions, send you technical notices and support messages, and respond
      to your comments and questions.`
    },
    {
      icon: Lock,
      title: "Data Security",
      content: `We implement appropriate security measures to protect your personal information against
      unauthorized access, alteration, disclosure, or destruction. We use encryption, secure
      servers, and other industry-standard security practices.`
    },
    {
      icon: Users,
      title: "Information Sharing",
      content: `We do not sell, trade, or otherwise transfer your personal information to third parties
      without your consent, except as described in this policy. We may share your information
      with trusted service providers who assist us in operating our platform.`
    }
  ];

  const contactInfo = {
    email: "pricetrackr85@gmail.com",
    phone: "+92 316 5365826"
  };

  return (
    <div className="min-h-screen" style={{ background: "#020617" }}>
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <Shield className="h-16 w-16 text-cyan-400 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-slate-400 text-lg">
              Last updated: January 15, 2024
            </p>
          </div>

          {/* Introduction */}
          <div className="mb-12 p-8 rounded-lg border border-cyan-400/10"
               style={{ background: "rgba(2, 6, 23, 0.5)" }}>
            <p className="text-slate-300 text-lg leading-relaxed">
              At PriceTracker, we are committed to protecting your privacy and ensuring the security
              of your personal information. This Privacy Policy explains how we collect, use, disclose,
              and safeguard your information when you use our price tracking platform.
            </p>
          </div>

          {/* Privacy Sections */}
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

          {/* Additional Sections */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="p-8 rounded-lg border border-cyan-400/10"
                 style={{ background: "rgba(2, 6, 23, 0.5)" }}>
              <h3 className="text-xl font-semibold text-white mb-4">
                Cookies and Tracking
              </h3>
              <p className="text-slate-300 mb-4">
                We use cookies and similar tracking technologies to collect and use personal
                information about you. This helps us provide a better user experience and
                analyze how our services are used.
              </p>
              <p className="text-slate-300">
                You can control cookie settings through your browser preferences, but some
                features may not function properly if cookies are disabled.
              </p>
            </div>

            <div className="p-8 rounded-lg border border-cyan-400/10"
                 style={{ background: "rgba(2, 6, 23, 0.5)" }}>
              <h3 className="text-xl font-semibold text-white mb-4">
                Your Rights
              </h3>
              <p className="text-slate-300 mb-4">
                You have the right to access, update, or delete your personal information.
                You may also object to or restrict certain processing of your information.
              </p>
              <p className="text-slate-300">
                To exercise these rights or if you have questions about our privacy practices,
                please contact us using the information provided below.
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="p-8 rounded-lg border border-cyan-400/10 text-center"
               style={{ background: "rgba(2, 6, 23, 0.5)" }}>
            <Mail className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-4">
              Contact Us
            </h3>
            <p className="text-slate-300 mb-6">
              If you have any questions about this Privacy Policy or our privacy practices,
              please contact us:
            </p>

            <div className="space-y-2 text-slate-300">
              <p>
                <strong className="text-white">Email:</strong> {contactInfo.email}
              </p>
              <p>
                <strong className="text-white">Phone:</strong> {contactInfo.phone}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
