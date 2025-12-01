import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav
      className={`glass-nav fixed top-0 left-0 right-0 z-50 ${
        !isHome ? "bg-[#f5deb3]/95 backdrop-blur-md" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="shrink-0 flex items-center">
            <Link
              to="/"
              className={`text-2xl font-bold ${
                isHome ? "text-black" : "text-green-700"
              }`}
            >
              Greenfield
            </Link>
          </div>
          <div className="hidden sm:flex sm:space-x-6">
            <Link
              to="/"
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all ${
                location.pathname === "/"
                  ? isHome
                    ? "bg-[#f5deb3]/50 text-black"
                    : "bg-green-100 text-green-700"
                  : isHome
                  ? "text-gray-700 hover:text-black hover:bg-[#f5deb3]/30"
                  : "text-gray-600 hover:text-green-700"
              }`}
            >
              Home
            </Link>
            <Link
              to="/about"
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all ${
                location.pathname === "/about"
                  ? "bg-green-100 text-green-700"
                  : isHome
                  ? "text-gray-700 hover:text-black hover:bg-[#f5deb3]/30"
                  : "text-gray-600 hover:text-green-700"
              }`}
            >
              About
            </Link>
            <Link
              to="/counter"
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all ${
                location.pathname === "/counter"
                  ? "bg-green-100 text-green-700"
                  : isHome
                  ? "text-gray-700 hover:text-black hover:bg-[#f5deb3]/30"
                  : "text-gray-600 hover:text-green-700"
              }`}
            >
              Services
            </Link>
            {user && (
              <Link
                to="/dashboard"
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  location.pathname.startsWith("/dashboard")
                    ? "bg-green-100 text-green-700"
                    : isHome
                    ? "text-gray-700 hover:text-black hover:bg-[#f5deb3]/30"
                    : "text-gray-600 hover:text-green-700"
                }`}
              >
                Dashboard
              </Link>
            )}
          </div>
          <div className="shrink-0 flex items-center gap-3">
            {user ? (
              <>
                <span
                  className={`text-sm font-medium ${
                    isHome ? "text-black" : "text-gray-700"
                  }`}
                >
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className={`inline-flex items-center px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    isHome
                      ? "bg-gray-600 text-white hover:bg-gray-700 border border-gray-700"
                      : "bg-gray-600 text-white hover:bg-gray-700"
                  }`}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/signin"
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    location.pathname === "/signin"
                      ? "bg-green-100 text-green-700"
                      : isHome
                      ? "text-gray-700 hover:text-black hover:bg-[#f5deb3]/30"
                      : "text-gray-600 hover:text-green-700"
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className={`inline-flex items-center px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    isHome
                      ? "bg-green-600 text-white hover:bg-green-700 border border-green-700"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
