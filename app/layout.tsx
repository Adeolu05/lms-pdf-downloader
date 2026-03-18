import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/context";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
    display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
    display: "swap",
});

export const metadata: Metadata = {
    title: "LMS PDF Downloader — Auto-download & organise your course PDFs",
    description: "Connect your LMS, scan course pages, and automatically download every PDF — organised by week, ready in minutes.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" dir="ltr">
            <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-background text-body antialiased`}>
                <AppProvider>
                    {children}
                </AppProvider>
            </body>
        </html>
    );
}
