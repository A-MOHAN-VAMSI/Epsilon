"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const firstRender = useRef(true);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    // Don't run a page transition when the application first loads.
    // The EPSILON boot sequence handles that.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    setTransitioning(true);

    const timer = window.setTimeout(() => {
      setTransitioning(false);
    }, 500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [pathname]);

  return (
    <div
      className={`epsilon-page-transition ${
        transitioning ? "epsilon-page-transitioning" : ""
      }`}
    >
      {children}
    </div>
  );
}