"use client";

import { useEffect, useState } from "react";

const bootMessages = [
  "INITIALIZING EDITOR ........ OK",
  "CONNECTING COLLABORATION ... OK",
  "SYNC ENGINE ................ OK",
  "AI PAIRING ................. READY",
  "ENVIRONMENT ................ ONLINE",
];

export default function EpsilonBootSequence() {
  const [visible, setVisible] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const alreadySeen = sessionStorage.getItem("epsilon_boot_seen");

    if (alreadySeen === "true") {
      setVisible(false);
      return;
    }

    sessionStorage.setItem("epsilon_boot_seen", "true");

    const messageTimer = setInterval(() => {
      setMessageIndex((current) => {
        if (current < bootMessages.length - 1) {
          return current + 1;
        }

        clearInterval(messageTimer);
        return current;
      });
    }, 350);

    const finishTimer = setTimeout(() => {
      setFinished(true);

      setTimeout(() => {
        setVisible(false);
      }, 700);
    }, 2400);

    return () => {
      clearInterval(messageTimer);
      clearTimeout(finishTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`epsilon-boot ${
        finished ? "epsilon-boot-finished" : ""
      }`}
      aria-label="EPSILON loading"
    >
      {/* Background grid */}
      <div className="epsilon-boot-grid" />

      {/* Scan line */}
      <div className="epsilon-scanline" />

      <div className="epsilon-boot-content">
        {/* EPSILON symbol */}
        <div className="epsilon-symbol">
          ε
        </div>

        {/* Brand */}
        <div className="epsilon-boot-brand">
          EPSILON
        </div>

        {/* System status */}
        <div className="epsilon-boot-title">
          SYSTEM BOOT
        </div>

        <div className="epsilon-boot-terminal">
          {bootMessages.slice(0, messageIndex + 1).map((message, index) => (
            <div
              key={message}
              className={`epsilon-boot-line ${
                index === messageIndex ? "active" : ""
              }`}
            >
              <span className="epsilon-prompt">&gt;</span>
              <span>{message}</span>
            </div>
          ))}
        </div>

        {/* Final state */}
        {finished && (
          <div className="epsilon-online">
            <span className="epsilon-online-dot" />
            COLLABORATION ONLINE
          </div>
        )}
      </div>

      {/* Bottom status */}
      <div className="epsilon-boot-footer">
        EPSILON // COLLABORATIVE DEVELOPMENT ENVIRONMENT
      </div>

      {/* Reduced motion / skip */}
      <button
        className="epsilon-skip"
        onClick={() => setVisible(false)}
        type="button"
      >
        SKIP
      </button>
    </div>
  );
}