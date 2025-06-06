import React from "react";

const LowStockAlert = () => {
  // Sample static data
  const lowStockItems = [
    { name: "Product D", stock: 3 },
    { name: "Product F", stock: 2 },
    { name: "Product G", stock: 1 },
  ];

  return (
    <div className="bg-white border rounded-lg shadow-sm p-6 mt-6">
      <h2 className="text-lg font-semibold text-red-600 mb-4">Low Stock Alerts</h2>
      {lowStockItems.length === 0 ? (
        <p className="text-sm text-gray-500">No products are currently low on stock.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {lowStockItems.map((item, index) => (
            <li key={index} className="py-2 flex justify-between text-sm">
              <span>{item.name}</span>
              <span className="text-red-500 font-medium">{item.stock} left</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LowStockAlert;