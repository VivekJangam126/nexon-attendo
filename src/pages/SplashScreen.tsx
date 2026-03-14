import { useNavigate } from "react-router-dom";
import { Building2, ArrowRight, Clock, Users, Calendar, TrendingUp, CheckCircle, Shield } from "lucide-react";

const SplashScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-amber-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="px-6 py-4 sm:px-8 sm:py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Nexus Attendo</h1>
                <p className="text-xs text-gray-600">Corporate Pvt Ltd</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
            >
              Sign In
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="px-6 py-12 sm:px-8 sm:py-20 lg:py-24">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold mb-4 animate-fade-in-up">
                  <CheckCircle className="w-3 h-3" />
                  Modern Attendance Management
                </div>
                
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                  Streamline Your
                  <span className="block bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
                    Workforce Management
                  </span>
                </h2>
                
                <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-xl mx-auto lg:mx-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                  Track attendance, manage leaves, and generate reports with our intelligent employee management system.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                  <button
                    onClick={() => navigate("/login")}
                    className="group px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-xl font-semibold text-sm hover:from-amber-700 hover:to-amber-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Right Content - Feature Cards */}
              <div className="grid grid-cols-2 gap-3 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <div className="col-span-2 bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-0.5 text-sm">Real-time Tracking</h3>
                      <p className="text-xs text-gray-600">Monitor attendance instantly</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="p-2 bg-green-100 rounded-xl mb-2 w-fit">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-0.5 text-xs">Team Management</h3>
                  <p className="text-xs text-gray-600">Organize efficiently</p>
                </div>
                
                <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="p-2 bg-purple-100 rounded-xl mb-2 w-fit">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-0.5 text-xs">Leave System</h3>
                  <p className="text-xs text-gray-600">Automated approvals</p>
                </div>
                
                <div className="col-span-2 bg-gradient-to-br from-amber-600 to-orange-500 rounded-2xl p-4 shadow-lg text-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-0.5 text-sm">Advanced Analytics</h3>
                      <p className="text-xs text-amber-100">Insights & reports at your fingertips</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 py-12 sm:px-8 bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Why Choose Nexus Attendo?</h3>
              <p className="text-sm text-gray-600 max-w-2xl mx-auto">
                Everything you need to manage your workforce efficiently in one powerful platform
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: Shield, title: "Secure & Reliable", desc: "Enterprise-grade security for your data", color: "blue" },
                { icon: Clock, title: "GPS Verification", desc: "Location-based attendance tracking", color: "green" },
                { icon: Calendar, title: "Holiday Management", desc: "Automated holiday calendar sync", color: "purple" },
                { icon: TrendingUp, title: "Smart Reports", desc: "Generate insights instantly", color: "amber" },
                { icon: Users, title: "Role Management", desc: "Flexible permission system", color: "red" },
                { icon: CheckCircle, title: "Easy to Use", desc: "Intuitive interface for everyone", color: "emerald" },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className={`p-2 bg-${feature.color}-100 rounded-xl mb-3 w-fit`}>
                    <feature.icon className={`w-5 h-5 text-${feature.color}-600`} />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1 text-sm">{feature.title}</h4>
                  <p className="text-xs text-gray-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-12 sm:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-br from-amber-600 via-amber-500 to-orange-500 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
              <div className="relative z-10">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                  Ready to Get Started?
                </h3>
                <p className="text-amber-100 text-sm sm:text-base mb-6 max-w-2xl mx-auto">
                  Join modern companies using Nexus Attendo for seamless workforce management
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="px-6 py-3 bg-white text-amber-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center gap-2"
                >
                  Start Now
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-8 sm:px-8 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-sm text-gray-600">
              © 2026 Nexus Corporate Pvt Ltd. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default SplashScreen;
