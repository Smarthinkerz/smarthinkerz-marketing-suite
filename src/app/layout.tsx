import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "SmarThinkerz Marketing Suite";

// Next 15.5.4 has a known bug (NEXT-4720) where statically exporting the
// built-in /404 and /_error pages crashes with a null React context. Forcing
// dynamic rendering at the root skips that static export and avoids the crash.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — AI-Powered Marketing Platform You Control`,
    template: `%s — ${APP_NAME}`,
  },
  description:
    "Run campaigns, create content, optimize SEO, and analyze results — all in one AI-driven, self-hostable marketing platform.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

const themeScript = `(function(){try{var t=localStorage.getItem('ms-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}var r=document.documentElement;r.classList.toggle('dark',t==='dark');r.style.colorScheme=t;}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
