"use client";

import { useEffect, useState } from "react";

export default function EpsilonBootSequence() {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const alreadySeen = sessionStorage.getItem("epsilon_boot_seen");

    if (alreadySeen === "true") {
      document.body.classList.add("epsilon-site-ready");
      setVisible(false);
      return;
    }

    sessionStorage.setItem("epsilon_boot_seen", "true");

    const duration = 1450;
    let startTime: number | null = null;
    let animationFrame = 0;

    const animate = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);

      const easedProgress =
        1 - Math.pow(1 - rawProgress, 3);

      setProgress(Math.round(easedProgress * 100));

      if (rawProgress < 1) {
        animationFrame = requestAnimationFrame(animate);
        return;
      }

      /*
       * BOOT COMPLETE
       *
       * Start the website reveal and boot exit together.
       */
      window.setTimeout(() => {
        document.body.classList.add("epsilon-site-ready");

        // Give the website a tiny moment to begin revealing.
        window.setTimeout(() => {
          setExiting(true);
        }, 120);

        // Remove boot after the cinematic transition.
        window.setTimeout(() => {
          setVisible(false);
        }, 1100);
      }, 250);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
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
      aria-label="EPSILON"
    >
      <div className="epsilon-boot-glow" />

      <div className="epsilon-boot-grid" />

      <div className="epsilon-boot-center">

        <div className="epsilon-boot-symbol">
          ε
        </div>

        <div className="epsilon-boot-brand">
          E P S I L O N
        </div>

        <div className="epsilon-boot-status">
          <span>INITIALIZING</span>
          <span>{progress}%</span>
        </div>

        <div className="epsilon-boot-progress">
          <div
            className="epsilon-boot-progress-bar"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <div
          className={`epsilon-boot-ready ${
            progress >= 100 ? "visible" : ""
          }`}
        >
          READY
        </div>

      </div>

      <div className="epsilon-boot-meta">
        <span>EPSILON</span>
        <span>COLLABORATIVE DEVELOPMENT ENVIRONMENT</span>
        <span>V2.0</span>
      </div>
    </div>
  );
}