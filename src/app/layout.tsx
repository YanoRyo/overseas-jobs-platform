import "./globals.css";

// Root layout: minimal pass-through for [locale] layout to handle html/body
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
