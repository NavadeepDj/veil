import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Veil | Private Complaint Triage",
  description: "Privacy-preserving student complaint triage with selective disclosure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
