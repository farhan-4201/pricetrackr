import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Zap, 
  Crown, 
  Rocket,
  ArrowRight,
  Star
} from "lucide-react";

export const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [hoveredPlan, setHoveredPlan] = useState(null);

  const plans = [
    {
      name: "Free",
      price: { monthly: 0, yearly: 0 },
      description: "Perfect for casual shoppers",
      features: [
        "Track up to 10 products",
        "Basic price alerts",
        "7-day price history",
        "Email notifications",
        "Community support"
      ],
      limitations: [
        "Limited marketplace coverage",
        "Standard alert frequency"
      ],
      cta: "Get Started Free",
      popular: false,
      icon: Zap,
      gradient: "from-slate-600 to-slate-700"
    },
    {
      name: "Pro", 
      price: { monthly: 9.99, yearly: 99.99 },
      description: "Best for regular online shoppers",
      features: [
        "Track unlimited products",
        "Advanced price alerts", 
        "Full price history (2 years)",
        "Multi-channel notifications",
        "Price predictions",
        "Bulk import tools",
        "Priority support",
        "Advanced analytics"
      ],
      cta: "Start Pro Trial",
      popular: true,
      icon: Crown,
      gradient: "from-cyan-400 to-green-400"
    },
    {
      name: "Business",
      price: { monthly: 29.99, yearly: 299.99 },
      description: "For businesses and power users",
      features: [
        "Everything in Pro",
        "API access",
        "Team collaboration",
        "Custom alerts & automations",
        "White-label options",
        "Dedicated account manager",
        "SLA guarantee",
        "Custom integrations"
      ],
      cta: "Contact Sales",
      popular: false,
      icon: Rocket,
      gradient: "from-purple-400 to-cyan-400"
    }
  ];

  const faqs = [
    {
      question: "Can I change plans anytime?",
      answer: "Yes! You can upgrade, downgrade, or cancel your plan at any time. Changes take effect immediately."
    },
    {
      question: "Do you offer refunds?",
      answer: "We offer a 30-day money-back guarantee for all paid plans. No questions asked."
    },
    {
      question: "How accurate are the price alerts?",
      answer: "Our alerts have 99.9% accuracy with sub-minute response times for price changes."
    },
    {
      question: "Is there a limit to notifications?",
      answer: "Free users get up to 50 alerts/month. Pro and Business users have unlimited alerts."
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
            <Star className="h-4 w-4" />
            <span>Simple Pricing</span>
          </Badge>

          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
              Choose Your
            </span>
            <br />
            <span className="text-white">Savings Plan</span>
          </h1>
          
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-12">
            Start free and upgrade as your savings grow. All plans include our core features 
            with varying limits and advanced capabilities.
          </p>

          {/* Billing Toggle */}
          <div 
            className="inline-flex p-1 rounded-lg mb-16"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(34, 211, 238, 0.1)"
            }}
          >
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-md font-medium transition-all duration-300 ${
                billingCycle === "monthly" ? 'text-white' : 'text-slate-400'
              }`}
              style={{
                background: billingCycle === "monthly" 
                  ? "linear-gradient(135deg, #22d3ee, #22c55e)" 
                  : "transparent"
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2 rounded-md font-medium transition-all duration-300 relative ${
                billingCycle === "yearly" ? 'text-white' : 'text-slate-400'
              }`}
              style={{
                background: billingCycle === "yearly" 
                  ? "linear-gradient(135deg, #22d3ee, #22c55e)" 
                  : "transparent"
              }}
            >
              Yearly
              <Badge 
                className="absolute -top-2 -right-2 text-xs px-2 py-0"
                style={{
                  background: "rgba(34, 197, 94, 0.2)",
                  color: "#22c55e",
                  border: "1px solid rgba(34, 197, 94, 0.3)"
                }}
              >
                Save 17%
              </Badge>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative p-8 rounded-2xl border transition-all duration-500 ${
                  plan.popular ? 'scale-105 lg:scale-110' : 'hover:scale-105'
                } ${hoveredPlan === index ? 'border-cyan-400/50' : ''}`}
                style={{
                  background: plan.popular 
                    ? "rgba(34, 211, 238, 0.1)" 
                    : "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: plan.popular 
                    ? "1px solid rgba(34, 211, 238, 0.3)" 
                    : "1px solid rgba(34, 211, 238, 0.1)",
                  boxShadow: plan.popular 
                    ? "0 20px 60px rgba(34, 211, 238, 0.2)" 
                    : "0 8px 32px rgba(0, 0, 0, 0.3)"
                }}
                onMouseEnter={() => setHoveredPlan(index)}
                onMouseLeave={() => setHoveredPlan(null)}
              >
                {plan.popular && (
                  <Badge 
                    className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 font-medium"
                    style={{
                      background: "linear-gradient(135deg, #22d3ee, #22c55e)",
                      color: "white",
                      border: "none"
                    }}
                  >
                    Most Popular
                  </Badge>
                )}

                <div className="text-center mb-8">
                  <div 
                    className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
                    style={{
                      background: `linear-gradient(135deg, ${plan.gradient})`,
                      boxShadow: "0 0 30px rgba(34, 211, 238, 0.3)"
                    }}
                  >
                    <plan.icon className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-slate-400 mb-6">{plan.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-center space-x-1">
                      <span className="text-4xl font-bold text-white">
                        ${plan.price[billingCycle]}
                      </span>
                      <span className="text-slate-400">
                        /{billingCycle === "yearly" ? "year" : "month"}
                      </span>
                    </div>
                    {billingCycle === "yearly" && plan.price.yearly > 0 && (
                      <div className="text-sm text-green-400">
                        Save ${(plan.price.monthly * 12 - plan.price.yearly).toFixed(2)} per year
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">{feature}</span>
                    </div>
                  ))}
                  
                  {plan.limitations && (
                    <div className="pt-4 border-t border-slate-700/50 space-y-2">
                      {plan.limitations.map((limitation, i) => (
                        <div key={i} className="text-sm text-slate-500">
                          • {limitation}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button 
                  className="w-full py-4 text-lg font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    background: plan.popular 
                      ? "linear-gradient(135deg, #22d3ee, #22c55e)" 
                      : "rgba(255, 255, 255, 0.05)",
                    border: plan.popular 
                      ? "none" 
                      : "1px solid rgba(34, 211, 238, 0.2)",
                    color: plan.popular ? "white" : "#22d3ee",
                    boxShadow: plan.popular ? "0 4px 20px rgba(34, 211, 238, 0.3)" : "none"
                  }}
                >
                  {plan.cta}
                  {plan.name !== "Business" && <ArrowRight className="ml-2 h-5 w-5" />}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
              Compare Plans
            </h2>
            <p className="text-xl text-slate-300">
              Detailed feature comparison across all plans
            </p>
          </div>

          <div 
            className="rounded-2xl border overflow-hidden"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(34, 211, 238, 0.1)"
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead 
                  className="border-b"
                  style={{ borderColor: "rgba(34, 211, 238, 0.1)" }}
                >
                  <tr>
                    <th className="text-left p-6 text-white font-semibold">Features</th>
                    <th className="text-center p-6 text-white font-semibold">Free</th>
                    <th className="text-center p-6 text-cyan-400 font-semibold">Pro</th>
                    <th className="text-center p-6 text-purple-400 font-semibold">Business</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Products Tracked", "10", "Unlimited", "Unlimited"],
                    ["Price History", "7 days", "2 years", "2+ years"],
                    ["Marketplaces", "5", "50+", "50+"],
                    ["API Access", "✗", "✗", "✓"],
                    ["Team Features", "✗", "✗", "✓"],
                    ["Priority Support", "✗", "✓", "✓"],
                    ["Custom Integrations", "✗", "✗", "✓"]
                  ].map((row, index) => (
                    <tr 
                      key={index}
                      className="border-b hover:bg-white/5 transition-colors"
                      style={{ borderColor: "rgba(34, 211, 238, 0.05)" }}
                    >
                      <td className="p-6 text-slate-300">{row[0]}</td>
                      <td className="p-6 text-center text-slate-400">{row[1]}</td>
                      <td className="p-6 text-center text-cyan-400 font-medium">{row[2]}</td>
                      <td className="p-6 text-center text-purple-400 font-medium">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="p-6 rounded-xl border"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(34, 211, 238, 0.1)"
                }}
              >
                <h3 className="text-xl font-semibold text-white mb-3">
                  {faq.question}
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div 
            className="p-12 rounded-2xl border"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(34, 211, 238, 0.2)",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)"
            }}
          >
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
                  Ready to Start Saving?
                </h2>
                <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                  Join over 500,000 users who save an average of $2,000+ annually with PriceTracker
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  className="px-12 py-4 text-lg font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #22d3ee, #22c55e)",
                    border: "none",
                    boxShadow: "0 6px 25px rgba(34, 211, 238, 0.4)"
                  }}
                >
                  Start Free Trial
                </Button>
                
                <Button 
                  variant="outline"
                  size="lg"
                  className="px-12 py-4 text-lg font-medium transition-all duration-300"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(168, 85, 247, 0.3)",
                    color: "#a855f7"
                  }}
                >
                  Contact Sales
                </Button>
              </div>

              <p className="text-sm text-slate-400">
                30-day money-back guarantee • No credit card required • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};