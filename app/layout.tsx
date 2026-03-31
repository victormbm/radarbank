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
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return (
    <html lang="en" className={inter.variable}>
      <head>
        {adsenseClientId && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
