import { useQuery } from "@tanstack/react-query";
import { Clock, MessageCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bookTasting, getPublicTasting, getTastingAgenda } from "@/lib/catalog.functions";
import { formatBRL } from "@/lib/pricing";
import { buildSlots } from "@/lib/quote-state";

type Props = { quoteId?: string | null; quoteUrl?: string; initialName?: string };

export function TastingBooking({ quoteId = null, quoteUrl = "", initialName = "" }: Props) {
  const agenda = useQuery({ queryKey: ["tasting-agenda"], queryFn: () => getTastingAgenda(), staleTime: 30_000 });
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState("");
  const [people, setPeople] = useState(1);
  const [booking, setBooking] = useState(false);
  const [result, setResult] = useState<null | { total: number; paymentLink: string; paymentStatus: string; status: string; publicToken: string | null }>(null);
  const bookingStatus = useQuery({ queryKey: ["public-tasting", result?.publicToken], queryFn: () => getPublicTasting({ data: { token: result?.publicToken ?? "" } }), enabled: Boolean(result?.publicToken), refetchInterval: 15_000 });
  const selectedDay = agenda.data?.dates.find((item) => item.date === date);
  const slots = selectedDay ? buildSlots(selectedDay.start_time, selectedDay.end_time, 60) : [];
  const booked = useMemo(() => new Set((agenda.data?.booked ?? []).filter((item) => item.date === date).map((item) => item.time)), [agenda.data?.booked, date]);
  const settings = agenda.data?.settings;
  const price = Number(settings?.tasting_price_per_person ?? 20);
  const total = result?.total ?? price * people;
  const confirmedAddress = bookingStatus.data?.address;
  const address = confirmedAddress ? [confirmedAddress.tasting_address, confirmedAddress.tasting_number, confirmedAddress.tasting_complement, confirmedAddress.tasting_neighborhood, confirmedAddress.tasting_city && confirmedAddress.tasting_state ? `${confirmedAddress.tasting_city} - ${confirmedAddress.tasting_state}` : confirmedAddress.tasting_city, confirmedAddress.tasting_cep].filter(Boolean).join(", ") : "";
  const brDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });

  async function reserve() {
    if (!date || !time || name.trim().length < 2 || phone.replace(/\D/g, "").length < 8) {
      toast.error("Preencha data, horário, nome e WhatsApp.");
      return;
    }
    setBooking(true);
    try {
      const next = await bookTasting({ data: { quote_id: quoteId, date, time, people, client_name: name, client_phone: phone } });
      setResult(next);
      await agenda.refetch();
      toast.success("Horário reservado por 30 minutos. O pagamento ainda está pendente.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível reservar.");
    } finally { setBooking(false); }
  }

  const whatsapp = String(settings?.payment_whatsapp_number || settings?.whatsapp_number || "").replace(/\D/g, "");
  const message = ["MAGIC BAR — DEGUSTAÇÃO", `Nome: ${name}`, `WhatsApp: ${phone}`, `Data: ${date ? brDate(date) : ""}`, `Horário: ${time}`, "Duração: 1 hora", `Quantidade de pessoas: ${people}`, `Valor total: ${formatBRL(total)}`, "Status do pagamento: Pendente", "Status da degustação: Pendente pagamento", quoteUrl ? `Orçamento: ${quoteUrl}` : ""].filter(Boolean).join("\n");

  return <div className="space-y-6">
    <div className="flex items-center gap-3"><Clock className="size-5" /><div><h2 className="font-display text-2xl font-bold">Agende sua degustação</h2><p className="text-sm text-muted-foreground">Conheça nossos drinks em uma experiência exclusiva de 1 hora.</p></div></div>
    <div className="flex flex-wrap gap-2">{(agenda.data?.dates ?? []).map((day) => <Button key={day.id} variant={date === day.date ? "default" : "outline"} className="h-auto min-h-12 rounded-xl py-2" onClick={() => { setDate(day.date); setTime(""); setResult(null); }}>{brDate(day.date)}</Button>)}</div>
    {selectedDay ? <div><p className="mb-2 text-sm font-medium">Horários</p><div className="flex flex-wrap gap-2">{slots.map((slot) => { const unavailable = booked.has(slot) || selectedDay.blocked_times.includes(slot); return <Button key={slot} disabled={unavailable || Boolean(result)} variant={time === slot ? "default" : "outline"} className="h-11 rounded-xl" onClick={() => setTime(slot)}>{slot} · {unavailable ? "Indisponível" : "Disponível"}</Button>; })}</div></div> : null}
    {time ? <div className="grid gap-4 sm:grid-cols-3"><div><Label htmlFor="tasting-name">Nome</Label><Input id="tasting-name" value={name} onChange={(event) => setName(event.target.value)} /></div><div><Label htmlFor="tasting-phone">WhatsApp</Label><Input id="tasting-phone" value={phone} onChange={(event) => setPhone(event.target.value)} /></div><div><Label htmlFor="tasting-people">Quantidade de pessoas</Label><Input id="tasting-people" type="number" min={1} max={50} value={people} onChange={(event) => setPeople(Math.max(1, Number(event.target.value) || 1))} /></div></div> : null}
    {time ? <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5"><div><p className="text-sm text-muted-foreground">{formatBRL(price)} por pessoa</p><p className="font-display text-3xl font-bold">{formatBRL(total)}</p></div><Button disabled={booking || Boolean(result)} className="h-12 rounded-xl" onClick={() => void reserve()}>{result ? "Reserva pendente de pagamento" : booking ? "Reservando…" : "Reservar e pagar"}</Button></div> : null}
    {result ? <div className="rounded-xl border border-border p-5"><p className="font-semibold">{bookingStatus.data?.status === "confirmed" ? "Degustação confirmada!" : "Pagamento pendente"}</p><p className="mt-1 text-sm text-muted-foreground">{bookingStatus.data?.status === "confirmed" ? "Seu pagamento foi validado pela equipe." : "O horário fica reservado por 30 minutos. A degustação só será confirmada após a equipe validar o pagamento."}</p><div className="mt-4 flex flex-wrap gap-3">{result.paymentLink && bookingStatus.data?.payment_status !== "paid" ? <Button asChild><a href={result.paymentLink} target="_blank" rel="noreferrer">Pagar degustação</a></Button> : null}{whatsapp ? <Button asChild variant="outline"><a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer"><MessageCircle className="mr-2 size-4" />Enviar comprovante</a></Button> : null}</div>{bookingStatus.data?.payment_status === "paid" && bookingStatus.data.status === "confirmed" ? <div className="mt-5"><p className="text-sm">{brDate(date)} · {time} · 1 hora · {people} pessoa(s) · {formatBRL(total)}</p>{address ? <p className="mt-1 text-sm">{address}</p> : null}</div> : null}</div> : null}
  </div>;
}