import type { Metadata } from "next";
import Link from "next/link";
import { DemoShell } from "@/components/ferready/shell";
import { isDemoEnabled } from "@/lib/prototype.mjs";
import { storefront } from "@/data/storefront.mjs";

import "./globals.css";
import "./ferready.css";
import "./campaign.css";
import "./template.css";

const demo = isDemoEnabled(process.env.FERREADY_DEMO);
export const metadata: Metadata = demo
  ? {
      title: {
        default: storefront.brandName,
        template: `%s | ${storefront.brandName}`,
      },
      description:
        storefront.description,
      robots: { index: false, follow: false },
      icons: { icon: "/template/product-placeholder.svg" },
    }
  : {
      title: { default: "hive-web", template: "%s · hive-web" },
      description: "Catálogo y guías de hive-web",
    };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (demo)
    return (
      <html lang="es-CO">
        <body>
          <DemoShell>{children}</DemoShell>
        </body>
      </html>
    );
  return (
    <html lang="es">
      <body>
        <header className="site-header">
          <Link href="/" className="brand">
            hive-web
          </Link>
          <nav>
            <Link href="/">Catálogo</Link>
            <Link href="/guias">Guías</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <p>hive-web · contenido aprobado manualmente</p>
        </footer>
      </body>
    </html>
  );
}
