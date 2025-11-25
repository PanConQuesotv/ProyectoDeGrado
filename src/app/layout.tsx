// app/layout.tsx
import './global.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Simulador CNC',
  description: 'Simulador de Fresadora CNC RA',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
