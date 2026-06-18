import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar">
      <head>
        <ScrollViewStyleReset />

        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-L91K64CYM0"
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-L91K64CYM0');
            `,
          }}
        />
      </head>

      <body>{children}</body>
    </html>
  );
}