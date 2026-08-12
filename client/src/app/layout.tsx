import type { Metadata } from "next";
import "../styles/globals.css";
import PageTransition from "@/components/layout/PageTransition";

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
      <body className="antialiased">
        <PageTransition>
          {children}
        </PageTransition>
      </body>
    </html>
  );
}