'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import ConfigureAmplifyClientSide from "@/components/ConfigureAmplify";
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import Navigation from "@/components/Navigation";
import OAuthListener from "@/components/OAuthListener";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no">
      <head>
        <title>Fagfilm auth fix</title>
        <meta name="description" content="Fagfilm autentisering og galleri" />
      </head>
      <body className={inter.className}>
        <ConfigureAmplifyClientSide />
        <Authenticator.Provider>
          <OAuthListener />
          <Navigation />
          <main>
            {children}
          </main>
        </Authenticator.Provider>
      </body>
    </html>
  );
}