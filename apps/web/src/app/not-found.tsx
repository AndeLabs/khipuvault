import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page Not Found | KhipuVault",
  description: "The page you are looking for could not be found.",
};

/**
 * Custom 404 Page
 * Shown when a route is not found
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center">
        {/* 404 Graphic */}
        <div className="relative mx-auto mb-8">
          <div className="text-[150px] font-bold leading-none text-muted-foreground/10 md:text-[200px]">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-lavanda/10 p-6">
              <svg
                className="h-16 w-16 text-lavanda md:h-20 md:w-20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Message */}
        <h1 className="mb-4 font-heading text-3xl font-bold text-foreground md:text-4xl">
          Page Not Found
        </h1>
        <p className="mx-auto mb-8 max-w-md text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you
          back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/">
            <Button variant="default" size="lg">
              Go to Homepage
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              Open Dashboard
            </Button>
          </Link>
        </div>

        {/* Help text */}
        <p className="mt-8 text-sm text-muted-foreground">
          Need help?{" "}
          <a
            href="https://github.com/khipuvault/khipuvault"
            target="_blank"
            rel="noopener noreferrer"
            className="text-lavanda underline-offset-4 hover:underline"
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
