import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KelasAI - AI Tutor untuk Sekolah Indonesia",
  description: "Platform belajar AI untuk siswa SD, SMP, SMA, SMK. Guru membuat sesi, siswa belajar dengan AI.",
  keywords: ["KelasAI", "AI Tutor", "Sekolah Indonesia", "Belajar AI", "Pendidikan"],
  authors: [{ name: "KelasAI" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "KelasAI - AI Tutor untuk Sekolah Indonesia",
    description: "Platform belajar AI untuk siswa SD, SMP, SMA, SMK. Guru membuat sesi, siswa belajar dengan AI.",
    siteName: "KelasAI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
