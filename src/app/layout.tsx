import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AppShell } from "@/components/app-shell";
import { THEME_SCRIPT } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { isLive } from "@/lib/whatsapp";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Zola", template: "%s · Zola" },
  description: "Inbox, leads and targets for your WhatsApp services bot",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Server-rendered, so React never re-creates it on the client. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full font-sans">
        <AppShell live={isLive()} hasPassword={Boolean(process.env.HUB_PASSWORD)}>
          {children}
        </AppShell>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
