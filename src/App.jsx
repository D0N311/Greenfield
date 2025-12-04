import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Counter from "./pages/Counter";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import LotPaymentHistory from "./pages/LotPaymentHistory";
import MemberProfile from "./pages/MemberProfile";
import YourLost from "./pages/YourLost";
import AuthGuard from "./components/AuthGuard";

function App() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Animated background - only on home page */}
      {isHome && <div className="glass-bg" />}

      {/* Routes */}
      <div className="grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/counter" element={<Counter />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route
            path="/lot-payment-history/:lotId"
            element={
              <AuthGuard>
                <LotPaymentHistory />
              </AuthGuard>
            }
          />
          <Route
            path="/members/:memberId/profile"
            element={
              <AuthGuard>
                <MemberProfile />
              </AuthGuard>
            }
          />
          <Route path="/yourlost" element={<YourLost />} />
          <Route path="*" element={<YourLost />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
