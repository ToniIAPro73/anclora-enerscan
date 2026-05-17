import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppPreferencesProvider } from "@/components/AppPreferencesProvider";
import CookieConsent from "@/components/CookieConsent";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Anclora EnergyScan",
  description: "Prediagnóstico energético orientativo para viviendas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var theme = localStorage.getItem('enerscan-theme') || 'dark';
                  var language = localStorage.getItem('enerscan-language') || 'es';
                  var currency = localStorage.getItem('enerscan-currency');
                  var units = localStorage.getItem('enerscan-measurement-system');
                  if (language !== 'en' && language !== 'de') language = 'es';
                  if (!currency) currency = language === 'en' ? 'GBP' : 'EUR';
                  if (!units) units = language === 'en' ? 'imperial' : 'metric';
                  var resolved = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : theme;
                  document.documentElement.dataset.theme = theme;
                  document.documentElement.lang = language;
                  document.cookie = 'enerscan-language=' + language + '; path=/; max-age=31536000; SameSite=Lax';
                  document.cookie = 'enerscan-currency=' + currency + '; path=/; max-age=31536000; SameSite=Lax';
                  document.cookie = 'enerscan-measurement-system=' + units + '; path=/; max-age=31536000; SameSite=Lax';
                  document.documentElement.classList.toggle('light', resolved === 'light');
                  document.documentElement.classList.toggle('dark', resolved !== 'light');
                } catch (error) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppPreferencesProvider>
          {children}
          <CookieConsent />
        </AppPreferencesProvider>
      </body>
    </html>
  );
}
