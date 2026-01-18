import { ReactNode } from 'react';
import Link from 'next/link';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <Link href="/" className="logo">
            🎮 Game Library
          </Link>
          <nav className="nav">
            <Link href="/" className="nav-link">
              Home
            </Link>
            <Link href="/about" className="nav-link">
              About
            </Link>
          </nav>
        </div>
      </header>
      <main className="main">{children}</main>
      <footer className="footer">
        <p>&copy; 2024 Game Library. Built with Next.js & Fastify.</p>
      </footer>
    </div>
  );
}
