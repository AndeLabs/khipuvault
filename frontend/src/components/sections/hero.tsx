import { Button } from "@/components/ui/button";
import { AnimateOnScroll } from "@/components/animate-on-scroll";

export function Hero() {
  return (
    <AnimateOnScroll>
        <section className="w-full py-24 md:py-32 lg:py-40">
          <div className="container mx-auto max-w-7xl px-4 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Ahorro Bitcoin con <br />
              <span className="text-gradient bg-gradient-to-r from-primary to-secondary">
                Rendimientos Reales
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground md:text-xl">
              Digitalizamos tradiciones financieras latinoamericanas. Pasanaku, Tandas y Roscas en blockchain con MUSD de Mezo.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" variant="secondary" className="transform transition-transform duration-300 hover:scale-105">
                🚀 Empezar Ahora
              </Button>
              <Button size="lg" variant="outline" className="border-primary text-primary transform transition-transform duration-300 hover:scale-105 hover:bg-primary/10 hover:text-primary">
                ▶️ Ver Demo
              </Button>
            </div>
          </div>
        </section>
    </AnimateOnScroll>
  );
}
