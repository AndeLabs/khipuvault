import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

const faqs = [
  {
    q: "¿Cómo funciona el Prize Pool?",
    a: "Los usuarios depositan BTC en el pool. Los rendimientos generados por todos los depósitos se acumulan en un bote de premios. Al final de cada ronda, un ganador se lleva todo el premio acumulado. Tu depósito inicial nunca está en riesgo."
  },
  {
    q: "¿Puedo perder mi dinero?",
    a: "No. Tu depósito de capital (los BTC que usas para comprar tickets) siempre está seguro y puedes retirarlo en cualquier momento. Lo único que se sortea son los rendimientos generados por el pool."
  },
  {
    q: "¿Cómo se elige al ganador?",
    a: "Utilizamos Chainlink VRF (Verifiable Random Function), un estándar de la industria para generar aleatoriedad de forma transparente y a prueba de manipulaciones en la blockchain."
  },
  {
    q: "¿Cuándo recibo mis fondos si no gano?",
    a: "Tus fondos depositados (capital) permanecen en el pool y continúan participando en las siguientes rondas hasta que decidas retirarlos. No necesitas hacer nada para seguir participando."
  }
];

export function RulesFaq() {
  return (
    <Card className="bg-card border-primary/20 shadow-custom">
      <CardHeader>
        <CardTitle>Reglas y Preguntas Frecuentes</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem value={`item-${index}`} key={index}>
              <AccordionTrigger>{faq.q}</AccordionTrigger>
              <AccordionContent>{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
