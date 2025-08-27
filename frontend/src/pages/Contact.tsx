import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  MessageCircle, 
  Phone, 
  MapPin, 
  Clock,
  Send,
  CheckCircle,
  HelpCircle,
  Zap
} from "lucide-react";

export const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Reset form after success message
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 3000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Get help from our support team",
      contact: "support@pricetracker.com",
      response: "Response within 24 hours",
      color: "#22d3ee"
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with our team in real-time",
      contact: "Available 24/7",
      response: "Instant response",
      color: "#22c55e"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak directly with our experts",
      contact: "+1 (555) 123-4567",
      response: "Mon-Fri 9AM-6PM EST",
      color: "#a855f7"
    }
  ];

  const faqs = [
    {
      question: "How do I add products to track?",
      answer: "Simply paste the product URL from any supported marketplace into our search bar, or use our browser extension for one-click tracking."
    },
    {
      question: "Which marketplaces do you support?",
      answer: "We support 50+ marketplaces including Amazon, eBay, AliExpress, Walmart, Best Buy, Target, and many more."
    },
    {
      question: "How accurate are your price alerts?",
      answer: "Our price monitoring has 99.9% accuracy with real-time updates. We check prices every few minutes to ensure you never miss a deal."
    },
    {
      question: "Can I export my tracked products?",
      answer: "Yes! Pro and Business users can export their watchlists, price history, and analytics data in CSV or JSON format."
    }
  ];

  return (
    <div style={{ background: '#020617' }} className="pt-16">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl text-center">
          <Badge 
            className="inline-flex items-center space-x-2 px-4 py-2 mb-6 font-medium"
            style={{
              background: "rgba(34, 211, 238, 0.1)",
              border: "1px solid rgba(34, 211, 238, 0.3)",
              color: "#22d3ee"
            }}
          >
            <MessageCircle className="h-4 w-4" />
            <span>Get In Touch</span>
          </Badge>

          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
              We're Here
            </span>
            <br />
            <span className="text-white">To Help</span>
          </h1>
          
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Have questions about PriceTracker? Need help getting started? Our friendly support team 
            is ready to assist you with anything you need.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {contactMethods.map((method, index) => (
              <div 
                key={index}
                className="p-8 rounded-xl border text-center transition-all duration-500 hover:scale-105 hover:border-cyan-400/50 group cursor-pointer"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(34, 211, 238, 0.1)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
                }}
              >
                <div 
                  className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: `${method.color}20`,
                    boxShadow: `0 0 30px ${method.color}30`
                  }}
                >
                  <method.icon className="h-8 w-8" style={{ color: method.color }} />
                </div>
                
                <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-cyan-400 transition-colors">
                  {method.title}
                </h3>
                
                <p className="text-slate-400 mb-4">{method.description}</p>
                
                <div className="space-y-2">
                  <div className="font-medium" style={{ color: method.color }}>
                    {method.contact}
                  </div>
                  <div className="text-sm text-slate-500">
                    {method.response}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
                  Send us a Message
                </h2>
                <p className="text-slate-300">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>
              </div>

              <div 
                className="p-8 rounded-xl border"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(34, 211, 238, 0.1)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
                }}
              >
                {isSubmitted ? (
                  <div className="text-center py-8">
                    <div 
                      className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
                      style={{
                        background: "rgba(34, 197, 94, 0.1)",
                        boxShadow: "0 0 30px rgba(34, 197, 94, 0.3)"
                      }}
                    >
                      <CheckCircle className="h-8 w-8 text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Message Sent!</h3>
                    <p className="text-slate-300">
                      Thanks for reaching out. We'll get back to you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <div onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Name *
                        </label>
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="text-white border-0"
                          style={{
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(34, 211, 238, 0.2)"
                          }}
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Email *
                        </label>
                        <Input
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="text-white border-0"
                          style={{
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(34, 211, 238, 0.2)"
                          }}
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Subject *
                      </label>
                      <Input
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="text-white border-0"
                        style={{
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(34, 211, 238, 0.2)"
                        }}
                        placeholder="What's this about?"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Message *
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={6}
                        className="w-full p-3 rounded-lg text-white placeholder-slate-400 border-0 resize-none"
                        style={{
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(34, 211, 238, 0.2)"
                        }}
                        placeholder="Tell us how we can help..."
                      />
                    </div>

                    <Button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 text-lg font-medium transition-all duration-300 hover:scale-105"
                      style={{
                        background: isSubmitting 
                          ? "rgba(34, 211, 238, 0.5)" 
                          : "linear-gradient(135deg, #22d3ee, #22c55e)",
                        border: "none",
                        boxShadow: "0 4px 20px rgba(34, 211, 238, 0.3)"
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Info & FAQ */}
            <div className="space-y-8">
              {/* Office Info */}
              <div 
                className="p-8 rounded-xl border"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(34, 211, 238, 0.1)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
                }}
              >
                <h3 className="text-2xl font-bold text-white mb-6">Visit Our Office</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: "rgba(34, 211, 238, 0.1)",
                        boxShadow: "0 0 20px rgba(34, 211, 238, 0.2)"
                      }}
                    >
                      <MapPin className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">Address</h4>
                      <p className="text-slate-300">
                        123 Tech Street, Suite 100<br />
                        San Francisco, CA 94105<br />
                        United States
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: "rgba(34, 197, 94, 0.1)",
                        boxShadow: "0 0 20px rgba(34, 197, 94, 0.2)"
                      }}
                    >
                      <Clock className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">Office Hours</h4>
                      <p className="text-slate-300">
                        Monday - Friday: 9:00 AM - 6:00 PM PST<br />
                        Saturday: 10:00 AM - 4:00 PM PST<br />
                        Sunday: Closed
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick FAQ */}
              <div 
                className="p-8 rounded-xl border"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(34, 211, 238, 0.1)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
                }}
              >
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <HelpCircle className="h-6 w-6 text-cyan-400 mr-2" />
                  Quick Answers
                </h3>
                
                <div className="space-y-4">
                  {faqs.slice(0, 2).map((faq, index) => (
                    <div key={index} className="space-y-2">
                      <h4 className="font-semibold text-white text-sm">{faq.question}</h4>
                      <p className="text-slate-400 text-sm leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                  
                  <div className="pt-4">
                    <a 
                      href="#"
                      className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium flex items-center"
                    >
                      View all FAQs <Zap className="h-4 w-4 ml-1" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};