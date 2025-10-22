import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { CreateTanda } from "@/components/dashboard/rotating-pool/create-tanda";
import { ExploreTandas } from "@/components/dashboard/rotating-pool/explore-tandas";
import { MyTandas } from "@/components/dashboard/rotating-pool/my-tandas";
import { TandaExplanation } from "@/components/dashboard/rotating-pool/tanda-explanation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function RotatingPoolPage() {
  return (
    <div className="flex flex-col gap-8">
      <AnimateOnScroll>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-primary hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver al Dashboard
        </Link>
        <h1 className="mt-4 flex items-center gap-3 text-3xl font-bold tracking-tight text-white">
          <span role="img" aria-label="arrows emoji" className="text-2xl">
            🔄
          </span>
          Rotating Pool (Pasanaku/Tanda)
        </h1>
      </AnimateOnScroll>

      <AnimateOnScroll delay="100ms">
        <TandaExplanation />
      </AnimateOnScroll>

      <Tabs defaultValue="explore" className="w-full">
        <AnimateOnScroll delay="200ms">
          <TabsList className="grid w-full grid-cols-3 bg-card border-primary/20">
            <TabsTrigger value="explore">Explorar Pools</TabsTrigger>
            <TabsTrigger value="my-tandas">Mis Tandas</TabsTrigger>
            <TabsTrigger value="create">Crear Tanda</TabsTrigger>
          </TabsList>
        </AnimateOnScroll>
        <AnimateOnScroll delay="300ms">
          <TabsContent value="explore" className="mt-6">
            <ExploreTandas />
          </TabsContent>
          <TabsContent value="my-tandas" className="mt-6">
            <MyTandas />
          </TabsContent>
          <TabsContent value="create" className="mt-6">
            <CreateTanda />
          </TabsContent>
        </AnimateOnScroll>
      </Tabs>
    </div>
  );
}
