import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Check } from "lucide-react";
import { config } from "@/lib/config";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 lg:flex">
        <Logo href="/" showText className="[&_span]:text-white" />
        <div className="relative z-10 text-white">
          <h2 className="text-3xl font-extrabold leading-tight">
            One platform for every marketing move.
          </h2>
          <ul className="mt-8 space-y-3 text-white/90">
            {[
              "10 AI tools in a single workspace",
              "Self-hostable on Supabase — you own your data",
              "Tier-based access from solo to enterprise",
              "Live analytics across every channel",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                  <Check className="h-4 w-4" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 text-sm text-white/70">
          © {new Date().getFullYear()} {config.appName}
        </p>
        <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-80 w-80 rounded-full bg-black/10 blur-3xl" />
      </div>

      {/* Form panel */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-6">
          <Link href="/" className="lg:hidden">
            <Logo />
          </Link>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
