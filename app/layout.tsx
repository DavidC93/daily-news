import type { Metadata } from "next";
import { Noto_Serif_Hebrew, Heebo } from "next/font/google";
import "./globals.css";

const serifHe = Noto_Serif_Hebrew({
  variable: "--font-serif-he",
  subsets: ["hebrew", "latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const sansHe = Heebo({
  variable: "--font-sans-he",
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const SITE_NAME = "היומית";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: {
    default: `${SITE_NAME} — מהדורת החדשות היומית`,
    template: `%s | ${SITE_NAME}`,
  },
  description: "מהדורה יומית אחת, מרכזת את החדשות החשובות מהיממה האחרונה.",
  openGraph: {
    siteName: SITE_NAME,
    locale: "he_IL",
    type: "website",
  },
};

const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      document.documentElement.setAttribute('data-theme', stored);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${serifHe.variable} ${sansHe.variable} h-full`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-paper text-ink">{children}</body>
    </html>
  );
}
