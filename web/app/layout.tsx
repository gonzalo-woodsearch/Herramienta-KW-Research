import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KW Research Tool - Dental España',
  description: 'Herramienta profesional de investigación de keywords para clínicas dentales usando Ahrefs API',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
