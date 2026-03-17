import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata = {
  title: 'Kin — Personal CRM',
  description: 'Remember the people you care about',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <div className="canvas">{children}</div>
        </body>
      </html>
    </ClerkProvider>
  );
}
