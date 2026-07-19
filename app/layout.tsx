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
    title: "LMS Study Pack — Course PDFs & Exam Packs",
    description:
        "Connect your Miva LMS, download course PDFs organised by week, and build Exam Pack PDFs from finished quiz attempts — private, local, and student-friendly.",
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
