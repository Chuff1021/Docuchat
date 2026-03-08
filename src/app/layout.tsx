import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "DocuBot — Your Business Knowledge, Instantly Accessible",
  description:
    "Upload your docs, get an AI expert that answers questions for your team and customers. One-shot answers with citations, embeddable chat widget, zero AI costs.",
  keywords: ["AI chatbot", "documentation", "customer support", "RAG", "knowledge base", "business chatbot", "document AI"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${inter.variable} font-sans bg-slate-950 text-slate-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}
