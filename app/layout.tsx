import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClassMate Connect",
  description: "Submit your freshman introduction post for ClassMate Connect."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
