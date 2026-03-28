import type { Metadata } from "next";
import "./globals.css";
import TopNav from "./components/common/TopNav";

export const metadata: Metadata = {
  title: "Game Library",
  description: "Enjoy a collection of fun mini-games and challenge yourself to beat other players' scores!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <TopNav />
        {children}
      </body>
    </html>
  );
}
