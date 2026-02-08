import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Seri Arcade",
  description: "Next-gen browser gaming portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="flex h-screen overflow-hidden bg-mesh">
          <Sidebar />
          <main className="flex-1 flex items-center justify-center p-6 overflow-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
