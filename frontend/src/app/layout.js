import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Inter } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: 'Task2Track - AI Powered Task Management',
  description: 'Streamline your team\'s workflow with intelligent task assignment and real-time analytics.',
};

export default function RootLayout({ children }) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://task2track.onrender.com';

  return (
    <html lang="en" className={inter.variable}>
      <head>
        {backendUrl && <link rel="preconnect" href={backendUrl} crossOrigin="anonymous" />}
      </head>
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
