import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Banco Seguro BR - Monitor de Saúde Bancária",
  description: "Monitoramento em tempo real da saúde dos bancos com alertas inteligentes",
  icons: {
    icon: [
      { url: '/assets/icons/favicon.svg', type: 'image/svg+xml' },
      { url: '/assets/icons/iconFavicon2.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/assets/icons/iconFavicon2.png',
    shortcut: '/assets/icons/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
