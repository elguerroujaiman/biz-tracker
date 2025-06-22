import React from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom"; 
import "./HomeStyle/HomePage.css";
import heroImage from "./HomeStyle/bg-hero.jpg";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="hero-section">
      <div className="hero-left">
        <h1 className="hero-title">
          Welcome to <span className="highlight">Store Tracker</span>
        </h1>
        <p className="hero-subtitle">
          Track your inventory, sales and performance.
        </p>
        <Button
          variant="primary"
          size="lg"
          className="dashboard-button mt-4"
          onClick={() => navigate("/dashboard")}
        >
          View Dashboard
        </Button>
      </div>

      <div className="hero-right">
        <div className="image-shape-bg"></div>
        <img src={heroImage} alt="Hero Illustration" className="hero-image" />
      </div>
    </div>
  );
};

export default HomePage;