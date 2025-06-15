import React from "react";
import { Button } from "react-bootstrap";
import "./HomeStyle/HomePage.css";

const HomePage = () => {
  return (
    <div className="hero-section">
      <div className="overlay">
        <div className="hero-content text-center">
          <h1 className="hero-title">Your Sales, Your Space.</h1>
          <p className="hero-subtitle">
            Track everything with ease, Organize smarter.
          </p>
          <Button variant="primary" size="lg" className="mt-4 dashboard-button">
            View Dashboard
          </Button>
        </div>
        <div className="decorative-blob" />
      </div>
    </div>
  );
};

export default HomePage;