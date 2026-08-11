import Link from "next/link";
import ReactMarkdown from "react-markdown";

import { slugifyHeading } from "@/lib/content/insights";

function headingText(children: React.ReactNode) {
  return Array.isArray(children) ? children.join("") : String(children);
}

export function InsightMarkdown({ body }: { body: string }) {
  const content = body.replace(/^#\s+[^\n]+\n+/, "");

  return (
    <ReactMarkdown
      components={{
        h2: ({ children }) => (
          <h2 id={slugifyHeading(headingText(children))}>{children}</h2>
        ),
        h3: ({ children }) => <h3>{children}</h3>,
        a: ({ children, href = "" }) =>
          href.startsWith("/") ? (
            <Link href={href}>{children}</Link>
          ) : (
            <a href={href} rel="noreferrer" target="_blank">
              {children}
            </a>
          ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
