import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
