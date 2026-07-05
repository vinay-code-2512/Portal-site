import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";

const AuthProvider = dynamic(() => import("@/context/AuthContext").then(m => ({ default: m.AuthProvider })));

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap", preload: true });

export const metadata: Metadata = {
  title: "Robot Genie Portal",
  description: "Admin, Employee & Student Portal",
  metadataBase: new URL("https://portal.robotgenie.in"),
  icons: {
    icon: "/RGLogo.png",
    shortcut: "/RGLogo.png",
    apple: "/RGLogo.png",
  },
  openGraph: {
    siteName: "Robot Genie Portal",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@robotgenie",
  },
  robots: {
    index: false,
    follow: false,
  },
};

const criticalCSS = `:root{--background:#0B0B1A;--bg-secondary:#0f0f1a;--bg-card:#141428;--foreground:#e5e7eb;--text-muted:#9ca3af;--text-light:#FFFFFF;--text-secondary:#A0A0B8;--neon-blue:#00f0ff;--neon-purple:#b500ff;--accent-gold:#FFD700;--border-light:#1f2937;--glass-nav:rgba(10,10,15,0.8);--glass-border:rgba(255,255,255,0.08);--font-heading:'Inter',sans-serif;--font-body:var(--font-sans)}html{scroll-behavior:smooth;overflow-x:hidden;width:100%}body{overflow-x:hidden;width:100%;background:var(--background);color:var(--foreground);font-family:var(--font-sans),Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}::-webkit-scrollbar{width:8px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.25);border-radius:4px}.gradient-text{background:linear-gradient(135deg,var(--neon-blue)0%,var(--neon-purple)100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${inter.variable} antialiased selection:bg-[var(--neon-blue)] selection:text-black`}>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
        <link rel="dns-prefetch" href="https://identitytoolkit.googleapis.com" />
        <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-VLQ74SHVGD"
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-VLQ74SHVGD');`}
        </Script>
        <AuthProvider>
          <main className="flex-grow">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
