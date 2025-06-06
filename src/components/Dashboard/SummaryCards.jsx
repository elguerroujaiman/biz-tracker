import React from "react";

const SummaryCards = () => {
  const stats = [
    {
      title: "Total Sales",
      value: 1240,
      icon: "🛒",
    },
    {
      title: "Total Revenue",
      value: "$42,300",
      icon: "💰",
    },
    {
      title: "Today’s Sales",
      value: 37,
      icon: "📅",
    },
    {
      title: "Total Products",
      value: 312,
      icon: "📦",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="bg-white shadow-sm border rounded-lg p-5 flex items-center justify-between hover:shadow-md transition"
        >
          <div>
            <h3 className="text-sm text-gray-500">{stat.title}</h3>
            <p className="text-xl font-semibold">{stat.value}</p>
          </div>
          <div className="text-3xl">{stat.icon}</div>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;