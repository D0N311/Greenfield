import Navigation from "../components/Navigation";
import Footer from "../components/Footer";

function Home() {
  return (
    <>
      {/* Navigation */}
      <Navigation />
      <div className="min-h-screen relative pt-20">
        {/* Main glassmorphism panel */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="glass-panel rounded-3xl p-8 md:p-12 lg:p-16 relative overflow-hidden">
            {/* Hero Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
              <div className="relative z-10">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-black mb-6 leading-tight">
                  Design That
                  <br />
                  Drives Growth
                </h1>
                <div className="flex flex-wrap gap-4 mb-8">
                  <button className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full transition-all shadow-lg hover:shadow-xl">
                    Let's Talk
                  </button>
                  <button className="px-8 py-4 bg-[#f5deb3] hover:bg-[#e6d5b8] text-gray-800 font-semibold rounded-full transition-all backdrop-blur-sm border border-gray-300">
                    Get in touch
                  </button>
                </div>
              </div>
              <div className="relative z-10">
                <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                  Turn raw data into meaningful experiences that scale. Our
                  approach blends clarity, trust, and innovation—helping brands
                  make better decisions, faster.
                </p>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              <div className="glass-panel rounded-2xl p-6 backdrop-blur-md bg-[#f5deb3]/80 border-gray-200">
                <p className="text-gray-700 text-sm leading-relaxed">
                  Exploring future-ready digital experiences for brands that aim
                  higher.
                </p>
              </div>
              <div className="glass-panel rounded-2xl p-6 backdrop-blur-md bg-[#f5deb3]/80 border-gray-200">
                <h3 className="text-black font-bold text-lg mb-2">
                  Accelerate Growth
                </h3>
                <p className="text-gray-600 text-sm">
                  Scale with precision and confidence.
                </p>
              </div>
              <div className="glass-panel rounded-2xl p-6 backdrop-blur-md bg-[#f5deb3]/80 border-gray-200">
                <h3 className="text-black font-bold text-lg mb-2">
                  Privacy First
                </h3>
                <p className="text-gray-600 text-sm">
                  Protect trust while driving innovation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <Footer />
    </>
  );
}

export default Home;
