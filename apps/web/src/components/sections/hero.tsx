'use client'

import { useState } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { AnimateOnScroll } from "@/components/animate-on-scroll"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { X } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function Hero() {
  const [showVideoModal, setShowVideoModal] = useState(false)

  return (
    <>
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
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ size: "lg", variant: "secondary" }), "transform transition-transform duration-300 hover:scale-105")}
              >
                🚀 Empezar Ahora
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-primary text-primary transform transition-transform duration-300 hover:scale-105 hover:bg-primary/10 hover:text-primary"
                onClick={() => setShowVideoModal(true)}
              >
                ▶️ Ver Demo
              </Button>
            </div>
          </div>
        </section>
      </AnimateOnScroll>

      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-black border-primary/20">
          <DialogHeader className="sr-only">
            <DialogTitle>Demo de KhipuVault</DialogTitle>
            <DialogDescription>
              Video demostrativo de cómo usar KhipuVault
            </DialogDescription>
          </DialogHeader>
          <button
            onClick={() => setShowVideoModal(false)}
            className="absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-5 w-5 text-white" />
            <span className="sr-only">Cerrar</span>
          </button>
          <div className="relative w-full pt-[56.25%]">
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src="https://www.youtube.com/embed/modELgWRWLA?autoplay=1&rel=0"
              title="KhipuVault Demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
