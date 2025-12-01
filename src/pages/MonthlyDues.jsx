import { DollarSign } from "lucide-react";

function MonthlyDues() {
  return (
    <div className="glass-panel rounded-3xl p-8 md:p-12">
      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="h-8 w-8 text-green-600" />
        <h1 className="text-4xl md:text-5xl font-bold text-black">
          Monthly Dues
        </h1>
      </div>
      <p className="text-lg text-gray-700 mb-8">
        Manage and track monthly homeowner association dues payments.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rounded-2xl p-6 backdrop-blur-md bg-[#f5deb3]/80 border-gray-200">
          <h3 className="text-black font-bold text-lg mb-2">Current Balance</h3>
          <p className="text-3xl font-semibold text-green-600">$0.00</p>
        </div>
        <div className="glass-panel rounded-2xl p-6 backdrop-blur-md bg-[#f5deb3]/80 border-gray-200">
          <h3 className="text-black font-bold text-lg mb-2">This Month</h3>
          <p className="text-3xl font-semibold text-green-600">$0.00</p>
        </div>
        <div className="glass-panel rounded-2xl p-6 backdrop-blur-md bg-[#f5deb3]/80 border-gray-200">
          <h3 className="text-black font-bold text-lg mb-2">Payment History</h3>
          <p className="text-3xl font-semibold text-green-600">0</p>
        </div>
      </div>
    </div>
  );
}

export default MonthlyDues;

