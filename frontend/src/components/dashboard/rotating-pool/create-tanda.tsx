
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  name: z.string().min(5, "Muy corto").max(60, "Muy largo"),
  description: z.string().max(300, "Máximo 300 caracteres").optional(),
  isPrivate: z.boolean().default(false),
  contribution: z.coerce.number().min(0.005).max(1),
  frequency: z.enum(["weekly", "biweekly", "monthly"]),
  members: z.number().min(3).max(50),
  order: z.enum(["random", "fifo", "manual"]),
});

const getDurationText = (frequency: "weekly" | "biweekly" | "monthly", members: number) => {
    let freqText = "";
    if (frequency === "weekly") freqText = "semanas";
    if (frequency === "biweekly") freqText = "quincenas";
    if (frequency === "monthly") freqText = "meses";
    return `${members} ${freqText}`;
}

export function CreateTanda() {
  const [contribution, setContribution] = useState(0.05);
  const [members, setMembers] = useState(10);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      contribution: 0.05,
      frequency: "monthly",
      members: 10,
      order: "random",
      isPrivate: false,
    },
  });

  const { watch } = form;
  const frequency = watch("frequency");
  const currentMembers = watch("members");

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  return (
    <Card className="bg-card border-primary/20 shadow-custom">
      <CardHeader>
        <CardTitle>Crear Nueva Tanda/Pasanaku</CardTitle>
        <CardDescription>Configura las reglas de tu grupo de ahorro rotativo.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Tanda</FormLabel>
                  <FormControl><Input placeholder="Ej: Tanda Mensual Familia García" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
            )}/>
            <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl><Textarea placeholder="Describe el propósito y reglas de tu tanda..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
            )}/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="contribution" render={({ field }) => (
                    <FormItem>
                         <div className="flex justify-between items-center">
                           <FormLabel>Contribución por Miembro</FormLabel>
                            <span className="font-code text-primary font-bold">{contribution.toFixed(4)} BTC</span>
                        </div>
                        <FormControl>
                            <Slider min={0.005} max={1} step={0.001} value={[contribution]} onValueChange={(v) => {setContribution(v[0]); field.onChange(v[0])}} />
                        </FormControl>
                    </FormItem>
                )}/>
                <FormField control={form.control} name="members" render={({ field }) => (
                    <FormItem>
                        <div className="flex justify-between items-center">
                            <FormLabel>Número de Miembros</FormLabel>
                            <span className="font-code text-primary font-bold">{members}</span>
                        </div>
                        <FormControl>
                            <Slider min={3} max={50} step={1} value={[members]} onValueChange={(v) => {setMembers(v[0]); field.onChange(v[0])}}/>
                        </FormControl>
                    </FormItem>
                )}/>
            </div>
             <FormField control={form.control} name="frequency" render={({ field }) => (
                <FormItem className="space-y-3">
                    <FormLabel>Frecuencia de Pago</FormLabel>
                    <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col md:flex-row gap-4">
                            <FormItem className="flex-1"><FormControl><RadioGroupItem value="weekly" id="weekly-create" className="sr-only" /></FormControl><Label htmlFor="weekly-create" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Semanal</Label></FormItem>
                            <FormItem className="flex-1"><FormControl><RadioGroupItem value="biweekly" id="biweekly-create" className="sr-only" /></FormControl><Label htmlFor="biweekly-create" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Quincenal</Label></FormItem>
                            <FormItem className="flex-1"><FormControl><RadioGroupItem value="monthly" id="monthly-create" className="sr-only" /></FormControl><Label htmlFor="monthly-create" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Mensual</Label></FormItem>
                        </RadioGroup>
                    </FormControl>
                </FormItem>
            )}/>
            <div className="p-4 rounded-lg bg-background/50 border border-primary/20 grid grid-cols-3 gap-4 text-center">
                <div><p className="text-sm text-muted-foreground">Cada miembro recibe</p><p className="font-bold font-code text-white">{(contribution * members).toFixed(4)} BTC</p></div>
                <div><p className="text-sm text-muted-foreground">Duración total</p><p className="font-bold text-white">{getDurationText(frequency, currentMembers)}</p></div>
                <div><p className="text-sm text-muted-foreground">Yield estimado</p><p className="font-bold text-secondary">~2.5%</p></div>
            </div>
            <FormField control={form.control} name="order" render={({ field }) => (
                <FormItem className="space-y-3">
                    <FormLabel>Orden de Turnos</FormLabel>
                    <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col md:flex-row gap-4">
                            <FormItem className="flex-1"><FormControl><RadioGroupItem value="random" id="random-create" className="sr-only" /></FormControl><Label htmlFor="random-create" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Aleatorio (Sorteo)</Label></FormItem>
                            <FormItem className="flex-1"><FormControl><RadioGroupItem value="fifo" id="fifo-create" className="sr-only" /></FormControl><Label htmlFor="fifo-create" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Por orden de llegada</Label></FormItem>
                            <FormItem className="flex-1"><FormControl><RadioGroupItem value="manual" id="manual-create" className="sr-only" /></FormControl><Label htmlFor="manual-create" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Manual (Tú asignas)</Label></FormItem>
                        </RadioGroup>
                    </FormControl>
                </FormItem>
            )}/>
            <FormField control={form.control} name="isPrivate" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background/50">
                    <div className="space-y-0.5">
                        <FormLabel>Hacer tanda privada</FormLabel>
                        <p className="text-xs text-muted-foreground">Solo visible para quienes tengan el enlace de invitación.</p>
                    </div>
                    <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                </FormItem>
            )}/>

            <div className="rounded-lg bg-background/50 p-4 border border-primary/20 space-y-2">
                <p className="font-bold text-center">💰 Costo de creación: 0.0001 BTC</p>
                <p className="text-xs text-muted-foreground text-center">Este pequeño fee se usa para prevenir el spam en la red.</p>
            </div>
            <div className="flex gap-4 pt-4">
              <Button type="submit" variant="secondary" className="w-full" disabled={!form.formState.isValid}>🚀 CREAR TANDA</Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => form.reset()}>❌ CANCELAR</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
