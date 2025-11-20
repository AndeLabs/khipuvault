/**
 * @fileoverview Create Pool Component - Production Ready
 * @module components/dashboard/cooperative-savings/create-pool
 * 
 * Allows users to create new cooperative pools on Mezo Testnet
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreatePool } from "@/hooks/web3/use-cooperative-pools";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "wagmi";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(5, "Muy corto").max(50, "Muy largo"),
  minContribution: z.coerce.number().min(0.001, "Mínimo 0.001 BTC"),
  maxContribution: z.coerce.number(),
  maxMembers: z.number().min(3).max(50),
  description: z.string().max(200, "Máximo 200 caracteres").optional().default(""),
  isPrivate: z.boolean().default(false),
  requireApproval: z.boolean().default(false),
  lockupPeriod: z.string().default("none"),
}).refine(data => data.maxContribution > data.minContribution, {
    message: "Máximo debe ser mayor que mínimo",
    path: ["maxContribution"],
});


export function CreatePool() {
  const [maxMembers, setMaxMembers] = useState(10);
  const { address } = useAccount();
  const { createPool, isPending } = useCreatePool();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      minContribution: 0.001,
      maxContribution: 0.01,
      maxMembers: 10,
      description: "",
      isPrivate: false,
      requireApproval: false,
      lockupPeriod: "none",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!address) {
      toast({
        title: "Wallet no conectada",
        description: "Por favor conecta tu wallet para crear un pool",
        variant: "destructive",
      })
      return
    }

    try {
      await createPool(
        values.name,
        values.minContribution.toString(),
        values.maxContribution.toString(),
        values.maxMembers
      )
      
      toast({
        title: "¡Pool creado!",
        description: `El pool "${values.name}" ha sido creado exitosamente`,
      })
      
      form.reset()
    } catch (error: any) {
      toast({
        title: "Error al crear pool",
        description: error.message || "No se pudo crear el pool",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="bg-card border-primary/20 shadow-custom">
      <CardHeader>
        <CardTitle>Crear Nuevo Pool Cooperativo</CardTitle>
        <CardDescription>Define las reglas y el propósito de tu grupo de ahorro.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Pool</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Ahorro Familiar García" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="minContribution"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Contribución Mínima</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Input type="number" step="0.001" {...field} className="font-code pr-12"/>
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 font-code text-muted-foreground">BTC</span>
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="maxContribution"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Contribución Máxima</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Input type="number" step="0.001" {...field} className="font-code pr-12"/>
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 font-code text-muted-foreground">BTC</span>
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <FormField
                control={form.control}
                name="maxMembers"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex justify-between items-center">
                            <FormLabel>Máximo de Miembros</FormLabel>
                            <span className="font-code text-primary font-bold">{maxMembers}</span>
                        </div>
                        <FormControl>
                            <Slider
                                min={3}
                                max={50}
                                step={1}
                                value={[maxMembers]}
                                onValueChange={(value) => {
                                    setMaxMembers(value[0]);
                                    field.onChange(value[0]);
                                }}
                            />
                        </FormControl>
                    </FormItem>
                )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe el propósito de tu pool..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Accordion type="single" collapsible>
                <AccordionItem value="item-1" className="border-primary/20">
                    <AccordionTrigger>Configuración Avanzada</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="isPrivate"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background/50">
                                    <div className="space-y-0.5">
                                        <FormLabel>Hacer pool privado</FormLabel>
                                        <p className="text-xs text-muted-foreground">Solo visible para quienes tengan el enlace.</p>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="lockupPeriod"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Periodo de Bloqueo (Lockup)</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || "none"}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">Sin bloqueo</SelectItem>
                                            <SelectItem value="30">30 días</SelectItem>
                                            <SelectItem value="90">90 días</SelectItem>
                                            <SelectItem value="180">180 días</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            
            <div className="rounded-lg bg-background/50 p-4 border border-primary/20 space-y-2">
                <p className="font-bold text-center">💰 Costo de creación: 0.0001 BTC</p>
                <p className="text-xs text-muted-foreground text-center">Este pequeño fee se usa para prevenir el spam en la red.</p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                type="submit" 
                variant="secondary" 
                className="w-full" 
                disabled={!form.formState.isValid || isPending || !address}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>🚀 CREAR POOL</>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => form.reset()}
                disabled={isPending}
              >
                ❌ CANCELAR
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
