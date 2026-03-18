import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/context";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
    title: "LMS Downloader v1.1 - Refined",
    description: "Automate downloading and organising course PDFs from LMS platforms",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" dir="ltr">
            <body className={`${plusJakartaSans.variable} font-sans bg-background text-body antialiased`}>
                <AppProvider>
                    {children}
                </AppProvider>
            </body>
        </html>
    );
}
