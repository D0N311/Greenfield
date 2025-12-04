import Sidebar from "../components/Sidabar";
import AuthGuard from "../components/AuthGuard";
import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import MonthlyDues from "./MonthlyDues";
import LotPayment from "./LotPayment";
import Lots from "./Lots";
import Contribution from "./Contribution";
import ContributionTypes from "./ContributionTypes";
import Members from "./Members";
import DeletedMembers from "./DeletedMembers";
import Penalty from "./Penalty";
import Authorize from "./Authorize";

function Dashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />
        <main
          className={`flex-1 transition-all duration-300 ${
            isSidebarCollapsed ? "ml-16" : "ml-64"
          }`}
        >
          <div className="p-8">
            <Routes>
              <Route path="monthly-dues" element={<MonthlyDues />} />
              <Route path="lot-payments" element={<LotPayment />} />
              <Route path="lots" element={<Lots />} />
              <Route path="contributions" element={<Contribution />} />
              <Route
                path="contribution-types"
                element={<ContributionTypes />}
              />
              <Route path="members" element={<Members />} />
              <Route path="deleted-members" element={<DeletedMembers />} />
              <Route path="penalties" element={<Penalty />} />
              <Route
                path="authorize"
                element={
                  <AuthGuard requireAdmin={true}>
                    <Authorize />
                  </AuthGuard>
                }
              />
              <Route
                path="*"
                element={
                  <div className="glass-panel rounded-3xl p-8 md:p-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
                      Dashboard
                    </h1>
                    <p className="text-lg text-gray-700">
                      Welcome to the Greenfield HOA Dashboard. Select a menu
                      item from the sidebar to get started.
                    </p>
                  </div>
                }
              />
            </Routes>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

export default Dashboard;
