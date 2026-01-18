"use client";

import Image from "next/image";
import Link from "next/link";

import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { Icons } from "@/components/icons";

const footerLinks = {
  product: [
    { name: "Individual Savings", href: "/dashboard/individual-savings" },
    { name: "Community Pools", href: "/dashboard/cooperative-savings" },
    { name: "Prize Pool", href: "/dashboard/prize-pool" },
    { name: "Dashboard", href: "/dashboard" },
  ],
  resources: [
    { name: "Documentation", href: "#", external: true },
    { name: "GitHub", href: "https://github.com/khipuvault", external: true },
    { name: "Smart Contracts", href: "#contracts" },
    { name: "Mezo Protocol", href: "https://mezo.org", external: true },
  ],
  company: [
    { name: "About", href: "#" },
    { name: "Blog", href: "#" },
    { name: "Twitter", href: "#", external: true },
    { name: "Discord", href: "#", external: true },
  ],
};

const socialLinks = [
  { name: "Twitter", href: "#", icon: Icons.twitter },
  { name: "Discord", href: "#", icon: Icons.discord },
  { name: "GitHub", href: "https://github.com/khipuvault", icon: Icons.github },
];

export function Footer() {
  return (
    <AnimateOnScroll>
      <footer className="border-t border-border bg-surface">
        <div className="container mx-auto max-w-7xl px-4 py-12 lg:py-16">
          {/* Main footer content */}
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="mb-4 flex items-center gap-2">
                <Image
                  src="/logos/khipu-logo.png"
                  alt="KhipuVault Logo"
                  width={40}
                  height={40}
                  className="h-10 w-10"
                />
                <span className="text-xl font-bold text-white">KhipuVault</span>
              </Link>
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                Decentralized Bitcoin savings platform. Earn real yields through Mezo Protocol.
              </p>

              {/* Social links */}
              <div className="flex items-center gap-4">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-elevated text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    aria-label={link.name}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <link.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Product links */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-white">Product</h3>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources links */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-white">Resources</h3>
              <ul className="space-y-3">
                {footerLinks.resources.map((link) => (
                  <li key={link.name}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {link.name}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Company links */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-white">Company</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {link.name}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} KhipuVault. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Built on</span>
              <a
                href="https://mezo.org"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary transition-colors hover:text-accent"
              >
                Mezo Protocol
              </a>
            </div>
          </div>
        </div>
      </footer>
    </AnimateOnScroll>
  );
}
