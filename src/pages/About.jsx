import Navigation from "../components/Navigation";
import Footer from "../components/Footer";

function About() {
  return (
    <>
      {/* Navigation */}
      <Navigation />
      <div className="min-h-screen relative pt-20 bg-gray-50">
        {/* Main glassmorphism panel */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="glass-panel rounded-3xl p-8 md:p-12 lg:p-16 relative overflow-hidden">
            {/* Hero Section */}
            <div className="mb-16">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-black mb-6 leading-tight">
                About
                <br />
                Greenfield HOA
              </h1>
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed max-w-3xl">
                Greenfield Homeowners Association is dedicated to creating a
                thriving, harmonious community where residents can enjoy quality
                living in a well-maintained and secure environment.
              </p>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
                  Our Mission
                </h2>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  To foster a sense of community, maintain property values, and
                  ensure the highest standards of living for all residents
                  through effective governance, transparent communication, and
                  dedicated service.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  We are committed to preserving the beauty and integrity of our
                  neighborhood while promoting a safe, welcoming environment for
                  families and individuals alike.
                </p>
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
                  Our Values
                </h2>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-3 text-xl">✓</span>
                    <p className="text-lg text-gray-700">
                      <strong className="text-black">Transparency:</strong> Open
                      communication and clear decision-making processes
                    </p>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-3 text-xl">✓</span>
                    <p className="text-lg text-gray-700">
                      <strong className="text-black">Community:</strong>{" "}
                      Building strong relationships among neighbors
                    </p>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-3 text-xl">✓</span>
                    <p className="text-lg text-gray-700">
                      <strong className="text-black">Excellence:</strong>{" "}
                      Maintaining high standards in all our endeavors
                    </p>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-3 text-xl">✓</span>
                    <p className="text-lg text-gray-700">
                      <strong className="text-black">Stewardship:</strong>{" "}
                      Responsible management of community resources
                    </p>
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              <div className="glass-panel rounded-2xl p-6 backdrop-blur-md bg-[#f5deb3]/80 border-gray-200">
                <h3 className="text-black font-bold text-lg mb-2">
                  Community First
                </h3>
                <p className="text-gray-600 text-sm">
                  We prioritize the well-being and satisfaction of all our
                  residents.
                </p>
              </div>
              <div className="glass-panel rounded-2xl p-6 backdrop-blur-md bg-[#f5deb3]/80 border-gray-200">
                <h3 className="text-black font-bold text-lg mb-2">
                  Quality Living
                </h3>
                <p className="text-gray-600 text-sm">
                  Maintaining beautiful, safe, and well-managed community
                  spaces.
                </p>
              </div>
              <div className="glass-panel rounded-2xl p-6 backdrop-blur-md bg-[#f5deb3]/80 border-gray-200">
                <h3 className="text-black font-bold text-lg mb-2">
                  Trust & Integrity
                </h3>
                <p className="text-gray-600 text-sm">
                  Operating with honesty, transparency, and accountability.
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

export default About;
