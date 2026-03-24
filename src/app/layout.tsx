import { ClerkProvider } from '@clerk/nextjs';
import { APP_NAME, APP_TAGLINE, APP_DESCRIPTION } from '@/lib/config';
import './globals.css';

export const metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description: APP_DESCRIPTION,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#F0F4F7" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        </head>
        <body>
          <div className="canvas">{children}</div>
        </body>
      </html>
    </ClerkProvider>
  );
}
