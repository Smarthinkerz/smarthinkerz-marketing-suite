import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground">
      <p className="text-sm font-semibold tracking-widest text-primary">404</p>
      <h1 className="text-3xl font-bold sm:text-4xl">Page not found</h1>
      <p className="max-w-md text-muted">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
      >
        Back to home
      </Link>
    </main>
  );
}
