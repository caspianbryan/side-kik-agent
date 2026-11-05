import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AppShell } from "@/components/app-shell";
import { isLive } from "@/lib/whatsapp";
import "./globals.css";

export const metadata: Metadata = {
  title: "WhatsApp Hub",
  description: "Inbox, leads and targets for the WhatsApp services bot",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <AppShell live={isLive()} hasPassword={Boolean(process.env.HUB_PASSWORD)}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
