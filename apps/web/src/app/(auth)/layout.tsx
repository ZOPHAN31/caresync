// Auth pages render their own full-screen layout (centered card with branding),
// so this layout is a simple pass-through.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
