import Image from "next/image";
import Link from "next/link";

import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { Icons } from "@/components/icons";

const socialLinks = [
  { name: "Twitter", href: "#", icon: Icons.twitter },
  { name: "Discord", href: "#", icon: Icons.discord },
  { name: "GitHub", href: "#", icon: Icons.github },
  { name: "Docs", href: "#", icon: Icons.docs },
];

export function Footer() {
  return (
    <AnimateOnScroll>
      <footer className="bg-background border-t border-primary/20">
        <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex flex-col items-center gap-4 text-center md:items-start md:text-left">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/logos/khipu-logo.png"
                  alt="KhipuVault Logo"
                  width={40}
                  height={40}
                  className="h-10 w-10"
                />
                <span className="text-2xl font-bold">KhipuVault</span>
              </Link>
              <p className="max-w-xs text-muted-foreground">
                Ahorro en Bitcoin con rendimientos, inspirado en tradiciones
                financieras de LATAM.
              </p>
            </div>
            <div className="flex items-center gap-6">
              {socialLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-muted-foreground transition-colors hover:text-primary"
                  aria-label={link.name}
                >
                  <link.icon className="h-6 w-6" />
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-8 border-t border-primary/10 pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} KhipuVault - Built on{" "}
              <a
                href="#"
                className="font-semibold text-primary transition-colors hover:text-secondary"
              >
                Mezo Protocol
              </a>
            </p>
          </div>
        </div>
      </footer>
    </AnimateOnScroll>
  );
}
