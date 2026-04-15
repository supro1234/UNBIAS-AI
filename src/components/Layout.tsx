import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

/**
 * Shared layout shell that:
 * 1. Keeps content to the right of the fixed sidebar
 * 2. Provides a sticky glass header per page
 */
export default function Layout({ children, title, subtitle }: LayoutProps) {
  return (
    <div style={{ marginLeft: 'var(--sidebar-w)', minHeight: '100vh', position: 'relative', zIndex: 10 }}>
      {/* Sticky page header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20,
        padding: '0 28px', height: 60,
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'rgba(6,6,12,0.72)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-.01em' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>{subtitle}</div>}
        </div>
      </header>

      {/* Page content */}
      <main style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {children}
      </main>
    </div>
  );
}
