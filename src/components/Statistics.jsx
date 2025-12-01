import React from "react";

const Statistics = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="glass-panel flex flex-col items-center justify-center text-center gap-1 rounded-lg p-3 backdrop-blur-md bg-[#f5deb3]/80 border-gray-200"
        >
          <h3 className="text-black font-bold text-sm mb-0">{stat.title}</h3>
          <p className="text-xl font-semibold text-green-600">{stat.value}</p>
          {stat.subtitle && (
            <p className="text-xs text-gray-600 mt-1">{stat.subtitle}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default Statistics;
