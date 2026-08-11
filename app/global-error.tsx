"use client";

import Link from "next/link";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          display: "grid",
          minHeight: "100svh",
          margin: 0,
          padding: "2rem",
          placeItems: "center",
          color: "#171914",
          background: "#f1f0eb",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <main style={{ width: "min(100%, 48rem)" }}>
          <p>Trexiti / System interruption</p>
          <h1>Something did not complete as expected.</h1>
          <p>Try the request again, or return to the Trexiti home page.</p>
          <button type="button" onClick={reset}>
            Try again
          </button>{" "}
          <Link href="/">Return home</Link>
        </main>
      </body>
    </html>
  );
}
