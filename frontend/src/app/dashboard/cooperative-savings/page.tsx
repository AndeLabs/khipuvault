'use client'

export const dynamic = 'force-dynamic'

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExplorePools } from "@/components/dashboard/cooperative-savings/explore-pools";
import { MyPools } from "@/components/dashboard/cooperative-savings/my-pools";
import { CreatePool } from "@/components/dashboard/cooperative-savings/create-pool";
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { RecommendedPools } from "@/components/dashboard/cooperative-savings/recommended-pools";

export default function CooperativeSavingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <AnimateOnScroll>
        <Link href="/dashboard" className="flex items-center gap-2 text-primary hover:underline">
          <ChevronLeft className="h-4 w-4" />
          Volver al Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-white mt-4 flex items-center gap-3">
          <span role="img" aria-label="handshake emoji" className="text-2xl">🤝</span>
          Cooperative Savings Pool
        </h1>
      </AnimateOnScroll>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <Tabs defaultValue="explore" className="w-full">
            <AnimateOnScroll delay="100ms">
              <TabsList className="grid w-full grid-cols-3 bg-card border-primary/20">
                <TabsTrigger value="explore">Explorar Pools</TabsTrigger>
                <TabsTrigger value="my-pools">Mis Pools</TabsTrigger>
                <TabsTrigger value="create">Crear Pool</TabsTrigger>
              </TabsList>
            </AnimateOnScroll>
            <AnimateOnScroll delay="200ms">
              <TabsContent value="explore" className="mt-6">
                <ExplorePools />
              </TabsContent>
              <TabsContent value="my-pools" className="mt-6">
                <MyPools />
              </TabsContent>
              <TabsContent value="create" className="mt-6">
                <CreatePool />
              </TabsContent>
            </AnimateOnScroll>
          </Tabs>
        </div>
        <div className="lg:col-span-1">
          <AnimateOnScroll delay="300ms">
            <RecommendedPools />
          </AnimateOnScroll>
        </div>
      </div>
    </div>
  );
}
