"use client";

import { useEffect, useState } from "react";

export default function EpsilonBootSequence() {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // During development, always show the boot sequence.
    // In production, show it once per browser session.
    const isDevelopment = process.env.NODE_ENV === "development";
    const alreadySeen = sessionStorage.getItem("epsilon_boot_seen");

    if (!isDevelopment && alreadySeen === "true") {
      document.body.classList.add("epsilon-site-ready");
      setVisible(false);
      return;
    }

    // Clear any previous ready state before starting the boot.
    document.body.classList.remove("epsilon-site-ready");

    if (!isDevelopment) {
      sessionStorage.setItem("epsilon_boot_seen", "true");
    }

    const duration = 1200;

    let startTime: number | null = null;
    let animationFrame = 0;

    const animate = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);

      // Smooth premium easing.
      const easedProgress =
        1 - Math.pow(1 - rawProgress, 3);

      setProgress(Math.round(easedProgress * 100));

      if (rawProgress < 1) {
        animationFrame = requestAnimationFrame(animate);
        return;
      }

      // Brief READY state.
      window.setTimeout(() => {
        document.body.classList.add("epsilon-site-ready");

        // Begin smooth exit.
        window.setTimeout(() => {
          setExiting(true);
        }, 100);

        // Remove boot layer after transition.
        window.setTimeout(() => {
          setVisible(false);
        }, 900);
      }, 150);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
      document.body.classList.remove("epsilon-site-ready");
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`epsilon-boot ${
        exiting ? "epsilon-boot-exiting" : ""
      }`}
      aria-label="EPSILON loading"
    >
      {/* Ambient glow */}
      <div className="epsilon-boot-glow" />

      {/* Technical grid */}
      <div className="epsilon-boot-grid" />

      {/* Center */}
      <div className="epsilon-boot-center">

        {/* Logo */}
        <div className="epsilon-boot-symbol">
          ε
        </div>

        {/* Brand */}
        <div className="epsilon-boot-brand">
          E P S I L O N
        </div>

        {/* Status */}
        <div className="epsilon-boot-status">
          <span>INITIALIZING</span>
          <span>{progress}%</span>
        </div>

        {/* Progress */}
        <div className="epsilon-boot-progress">
          <div
            className="epsilon-boot-progress-bar"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        {/* Ready */}
        <div
          className={`epsilon-boot-ready ${
            progress >= 100 ? "visible" : ""
          }`}
        >
          READY
        </div>
      </div>

      {/* Bottom metadata */}
      <div className="epsilon-boot-meta">
        <span>EPSILON</span>
        <span>
          COLLABORATIVE DEVELOPMENT ENVIRONMENT
        </span>
        <span>V2.0</span>
      </div>
    </div>
  );
}