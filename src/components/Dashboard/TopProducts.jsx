import React from "react";

const TopProducts = () => {
  // Sample static data
  const topProducts = [
    { name: "Product A", sales: 1200, stock: 15 },
    { name: "Product B", sales: 950, stock: 22 },
    { name: "Product C", sales: 875, stock: 10 },
    { name: "Product D", sales: 820, stock: 7 },
    { name: "Product E", sales: 760, stock: 18 },
  ];

  return (
    <div className="bg-white border rounded-lg shadow-sm p-6 mt-6">
      <h2 className="text-lg font-semibold mb-4">Top Products</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 font-medium text-gray-600">Product</th>
              <th className="px-4 py-2 font-medium text-gray-600">Sales</th>
              <th className="px-4 py-2 font-medium text-gray-600">Stock</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((product, index) => (
              <tr key={index} className="border-b">
                <td className="px-4 py-2">{product.name}</td>
                <td className="px-4 py-2">{product.sales}</td>
                <td className="px-4 py-2">{product.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopProducts;