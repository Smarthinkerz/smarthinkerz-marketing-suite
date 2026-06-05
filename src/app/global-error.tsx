"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.25rem",
          background: "#0b1020",
          color: "#f4f5fb",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
          textAlign: "center",
          padding: "1.5rem",
        }}
      >
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700 }}>
          Something went wrong
        </h1>
        <p style={{ maxWidth: "28rem", color: "#9aa3b2" }}>
          An unexpected error occurred. You can try again, and if the problem
          persists, please contact support.
        </p>
        <button
          onClick={() => reset()}
          style={{
            borderRadius: "9999px",
            background: "#8b5cf6",
            color: "#0b1020",
            padding: "0.75rem 1.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
