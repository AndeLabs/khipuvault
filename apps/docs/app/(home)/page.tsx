import Link from "next/link";
import { Book, Code2, Shield, Zap, ArrowRight, CheckCircle2 } from "lucide-react";

export default function HomePage() {
  return (
    <main className="relative w-full overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 -z-10">
        <div className="bg-primary/20 absolute top-0 left-1/4 h-96 w-96 animate-pulse rounded-full blur-3xl" />
        <div className="bg-accent/20 absolute right-1/4 bottom-0 h-80 w-80 animate-pulse rounded-full blur-3xl delay-1000" />
        <div className="from-primary/5 absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r to-transparent" />
      </div>

      {/* Hero Section */}
      <div className="container mx-auto max-w-7xl px-4 py-20 md:py-28 lg:py-36">
        <div className="text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
            </span>
            <span className="text-sm font-medium text-purple-300">Comprehensive Documentation</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            KhipuVault
            <br />
            <span className="animate-gradient from-primary via-accent to-primary bg-gradient-to-r bg-[length:200%_auto] bg-clip-text text-transparent">
              Documentation Hub
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300 md:text-xl">
            Everything you need to know about Bitcoin savings on Mezo blockchain. From beginner
            guides to developer APIs.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/docs/getting-started"
              className="group inline-flex h-12 items-center justify-center rounded-md px-8 text-base font-semibold text-gray-900 shadow-lg transition-all hover:shadow-xl"
              style={{
                background: "linear-gradient(to right, rgb(191, 164, 255), rgb(255, 199, 125))",
              }}
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/docs"
              className="hover:border-primary inline-flex h-12 items-center justify-center rounded-md border border-gray-700 bg-gray-800/50 px-8 text-base font-medium text-white transition-all hover:bg-gray-800"
            >
              Browse All Docs
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span>83 Pages</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span>7 Sections</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span>Full Search</span>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto max-w-7xl px-4 pb-20">
        <h2 className="mb-12 text-center text-3xl font-bold text-white">Explore Our Products</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/docs/products/individual-savings"
            className="group relative overflow-hidden rounded-xl border border-gray-700 bg-gray-800/50 p-6 transition-all hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
              <span className="text-2xl">🏦</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">Individual Savings</h3>
            <p className="text-sm text-gray-400">
              Personal Bitcoin vault with auto-compounding yields
            </p>
            <div className="mt-4 flex items-center text-sm font-medium text-purple-300">
              Learn more
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/docs/products/community-pools"
            className="group relative overflow-hidden rounded-xl border border-gray-700 bg-gray-800/50 p-6 transition-all hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">Community Pools</h3>
            <p className="text-sm text-gray-400">Save together with groups and share yields</p>
            <div className="mt-4 flex items-center text-sm font-medium text-purple-300">
              Learn more
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/docs/products/rotating-pool"
            className="group relative overflow-hidden rounded-xl border border-gray-700 bg-gray-800/50 p-6 transition-all hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
              <span className="text-2xl">🔄</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">Rotating Pool</h3>
            <p className="text-sm text-gray-400">Traditional ROSCA/Pasanaku on blockchain</p>
            <div className="mt-4 flex items-center text-sm font-medium text-purple-300">
              Learn more
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/docs/products/prize-pool"
            className="group relative overflow-hidden rounded-xl border border-gray-700 bg-gray-800/50 p-6 transition-all hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
              <span className="text-2xl">🎰</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">Prize Pool</h3>
            <p className="text-sm text-gray-400">No-loss lottery powered by yields</p>
            <div className="mt-4 flex items-center text-sm font-medium text-purple-300">
              Learn more
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </div>

      {/* Quick Links Section */}
      <div className="container mx-auto max-w-7xl px-4 pb-24">
        <h2 className="mb-12 text-center text-3xl font-bold text-white">Quick Access</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/docs/getting-started"
            className="group rounded-xl border border-gray-700 bg-gray-800/50 p-8 transition-all hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20"
          >
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-purple-500/10">
              <Book className="h-7 w-7 text-purple-400" />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-white">Getting Started</h3>
            <p className="mb-4 text-gray-400">
              New to KhipuVault? Learn the basics and make your first deposit in minutes.
            </p>
            <div className="flex items-center text-sm font-medium text-purple-300">
              Start learning
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/docs/developers"
            className="group rounded-xl border border-gray-700 bg-gray-800/50 p-8 transition-all hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/20"
          >
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-orange-500/10">
              <Code2 className="h-7 w-7 text-orange-400" />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-white">For Developers</h3>
            <p className="mb-4 text-gray-400">
              Integrate KhipuVault into your app with our comprehensive API documentation.
            </p>
            <div className="flex items-center text-sm font-medium text-orange-300">
              View API docs
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/docs/security"
            className="group rounded-xl border border-gray-700 bg-gray-800/50 p-8 transition-all hover:border-green-400 hover:shadow-lg hover:shadow-green-500/20"
          >
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-green-500/10">
              <Shield className="h-7 w-7 text-green-400" />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-white">Security</h3>
            <p className="mb-4 text-gray-400">
              Learn about our audits, best practices, and how we keep your Bitcoin safe.
            </p>
            <div className="flex items-center text-sm font-medium text-green-300">
              Read security docs
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto max-w-4xl px-4 pb-24">
        <div className="relative overflow-hidden rounded-2xl border border-gray-700 bg-gradient-to-br from-purple-900/20 via-gray-800/50 to-orange-900/20 p-12 text-center backdrop-blur-sm">
          <div className="relative z-10">
            <Zap className="mx-auto mb-4 h-12 w-12 text-orange-400" />
            <h2 className="mb-4 text-3xl font-bold text-white">Ready to Start?</h2>
            <p className="mb-8 text-lg text-gray-300">
              Join thousands of users earning yields on their Bitcoin
            </p>
            <Link
              href="https://khipuvault.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center rounded-md px-8 text-base font-semibold text-gray-900 shadow-lg transition-all hover:shadow-xl"
              style={{
                background: "linear-gradient(to right, rgb(191, 164, 255), rgb(255, 199, 125))",
              }}
            >
              Launch App
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
