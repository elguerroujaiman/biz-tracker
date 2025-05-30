import React from "react";

const ExportCSVButton = ({ data, filename = "export.csv" }) => {
  const handleDownload = () => {
    const headers = Object.keys(data[0] || {}).join(",");
    const rows = data.map(row => Object.values(row).join(",")).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      style={{
        backgroundColor: "#2196F3",
        color: "white",
        padding: "0.5rem 1rem",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
      }}
    >
      Export CSV
    </button>
  );
};

export default ExportCSVButton;