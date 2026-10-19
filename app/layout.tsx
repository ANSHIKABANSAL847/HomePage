import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saffron & Stone | Order from your table",
  description: "Explore the Saffron & Stone menu and order your table favourites.",
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
