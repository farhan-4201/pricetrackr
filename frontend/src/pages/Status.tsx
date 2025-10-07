import { Activity, CheckCircle, XCircle, Clock, Server, Database } from "lucide-react";

const Status = () => {
  const services = [
    {
      name: "PriceTracker API",
      status: "operational",
      uptime: "99.9%",
      responseTime: "245ms",
      lastChecked: "2 minutes ago"
    },
    {
      name: "Daraz Scraper",
      status: "operational",
      uptime: "99.7%",
      responseTime: "1.2s",
      lastChecked: "1 minute ago"
    },
    {
      name: "PriceOye Scraper",
      status: "operational",
      uptime: "99.8%",
      responseTime: "890ms",
      lastChecked: "3 minutes ago"
    },
    {
      name: "Telemart Scraper",
      status: "operational",
      uptime: "99.6%",
      responseTime: "1.5s",
      lastChecked: "1 minute ago"
    },
    {
      name: "Database",
      status: "operational",
      uptime: "99.9%",
      responseTime: "45ms",
      lastChecked: "1 minute ago"
    },
    {
      name: "Notification Service",
      status: "operational",
      uptime: "99.8%",
      responseTime: "120ms",
      lastChecked: "2 minutes ago"
    }
  ];

  const incidents = [
    {
      date: "2024-01-15",
      title: "Scheduled Maintenance",
      status: "resolved",
      description: "Database optimization completed successfully",
      duration: "2 hours"
    },
    {
      date: "2024-01-10",
      title: "API Rate Limiting",
      status: "resolved",
      description: "Temporary rate limiting due to high traffic",
      duration: "45 minutes"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'degraded':
        return <Clock className="h-5 w-5 text-yellow-400" />;
      case 'outage':
        return <XCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Activity className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-400';
      case 'degraded':
        return 'text-yellow-400';
      case 'outage':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#020617" }}>
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <Activity className="h-16 w-16 text-cyan-400 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-white mb-4">
              System Status
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Real-time status of all PriceTracker services and infrastructure.
              We monitor our systems 24/7 to ensure maximum uptime.
            </p>
          </div>

          {/* Overall Status */}
          <div className="mb-12">
            <div className="flex items-center justify-center mb-8">
              <CheckCircle className="h-8 w-8 text-green-400 mr-3" />
              <span className="text-2xl font-semibold text-green-400">
                All Systems Operational
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">99.8%</div>
                <div className="text-slate-400 text-sm">Uptime (30d)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">245ms</div>
                <div className="text-slate-400 text-sm">Avg Response</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-slate-400 text-sm">Active Incidents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-slate-400 text-sm">Monitoring</div>
              </div>
            </div>
          </div>

          {/* Service Status */}
          <div className="mb-16">
            <h2 className="text-2xl font-semibold text-white mb-8 flex items-center">
              <Server className="h-6 w-6 text-cyan-400 mr-3" />
              Service Status
            </h2>

            <div className="grid gap-4">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="p-6 rounded-lg border border-cyan-400/10"
                  style={{ background: "rgba(2, 6, 23, 0.5)" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getStatusIcon(service.status)}
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-white">
                          {service.name}
                        </h3>
                        <p className="text-slate-400 text-sm">
                          Last checked {service.lastChecked}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`font-medium ${getStatusColor(service.status)}`}>
                        {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                      </div>
                      <div className="text-slate-400 text-sm">
                        {service.uptime} uptime
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Response Time:</span>
                      <span className="text-white ml-2">{service.responseTime}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Incidents */}
          <div className="mb-16">
            <h2 className="text-2xl font-semibold text-white mb-8 flex items-center">
              <Clock className="h-6 w-6 text-cyan-400 mr-3" />
              Recent Incidents
            </h2>

            <div className="space-y-4">
              {incidents.map((incident, index) => (
                <div
                  key={index}
                  className="p-6 rounded-lg border border-cyan-400/10"
                  style={{ background: "rgba(2, 6, 23, 0.5)" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-white">
                      {incident.title}
                    </h3>
                    <span className="text-sm text-slate-400">
                      {incident.date}
                    </span>
                  </div>

                  <p className="text-slate-400 mb-3">
                    {incident.description}
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-400 font-medium">
                      {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                    </span>
                    <span className="text-slate-400">
                      Duration: {incident.duration}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="text-center">
            <div className="p-8 rounded-lg border border-cyan-400/10 max-w-2xl mx-auto"
                 style={{ background: "rgba(2, 6, 23, 0.5)" }}>
              <Database className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Need to Report an Issue?
              </h3>
              <p className="text-slate-400 mb-6">
                If you're experiencing issues not shown here, please let us know.
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

export default Status;
