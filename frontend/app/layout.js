import './globals.css';

export const metadata = {
  title: 'Aftaar Manager',
  description: 'Aftaar Expense Tracking System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="aftaar">
      <body>{children}</body>
    </html>
  );
}
