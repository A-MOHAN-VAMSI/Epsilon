import type { Metadata } from "next";

import "../styles/globals.css";

export const metadata: Metadata = {
  title: "EPSILON",
  description:
    "Real-Time Collaborative Code Editor built with Next.js, Socket.IO and Monaco Editor.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
