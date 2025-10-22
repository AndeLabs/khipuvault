import Link from "next/link";
import { Header } from "../components/layout/header";
import { Footer } from "../components/layout/footer";
import { Hero } from "../components/sections/hero";
import { Stats } from "../components/sections/stats";
import { Features } from "../components/sections/features";
import { Button } from "../components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-grow">
        <Hero />
        <Stats />
        <Features />
        <div className="text-center py-20">
          <Link href="/dashboard">
            <Button size="lg" variant="secondary">Ir al Dashboard</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
