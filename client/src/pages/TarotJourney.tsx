import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CircleCheck, Heart, LockKeyhole, Moon, Sparkles, Star, WalletCards } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const cards = [
  { id: "luna", name: "Luna", glyph: "☾" }, { id: "oglinda", name: "Oglinda", glyph: "◌" },
  { id: "steaua", name: "Steaua", glyph: "✦" }, { id: "valul", name: "Valul", glyph: "≈" },
  { id: "radacina", name: "Rădăcina", glyph: "⌇" }, { id: "poarta", name: "Poarta", glyph: "⟡" },
  { id: "pana", name: "Pana", glyph: "❈" }, { id: "roata", name: "Roata", glyph: "◒" },
] as const;

const topics = [
  { id: "relationships", title: "Relații", subtitle: "apropiere, limite și comunicare", icon: Heart },
  { id: "direction", title: "Direcție personală", subtitle: "decizii, schimbare și ritm", icon: Sparkles },
  { id: "work", title: "Muncă și resurse", subtitle: "muncă, bani și stabilitate", icon: WalletCards },
  { id: "inner", title: "Stare interioară", subtitle: "ce simți și ce ai nevoie", icon: Moon },
];

const offers = {
  numerology: { eyebrow: "Pasul următor", title: "Numerologie personală", lead: "Adaugă o sinteză simbolică bazată pe numele și data deja oferite.", price: "47 lei", next: "/oferte/tarot/aproapegata", includes: ["o sinteză a numerelor personale", "teme și ritmuri de reflecție", "livrare cu ghidul tarot"] },
  portrait: { eyebrow: "Aproape gata", title: "Portret simbolic", lead: "Adaugă un portret creat cu AI, inspirat de contextul ales și de ghidul tău.", price: "47 lei", next: "/oferte/tarot/stai", includes: ["o schiță simbolică pregătită cu AI", "teme relaționale pentru reflecție", "livrare cu ghidul tarot"] },
  palm: { eyebrow: "Stai puțin", title: "Ghid pentru palmă", lead: "Poți adăuga și o sinteză simbolică a palmei. După plată, încarci fotografia în spațiul tău privat.", price: "47 lei", next: "/oferte/tarot/multumesc", includes: ["încărcare sau fotografie din telefon", "sinteză simbolică a marcajelor observate", "livrare împreună cu ghidul"] },
} as const;

type OfferKey = keyof typeof offers;

function TarotShell({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen bg-[#10131c] text-[#f5efe3] selection:bg-[#c9a76a] selection:text-[#10131c]">
    <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-15%,rgba(183,156,103,.24),transparent_34rem)]" />
    <div className="relative mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:px-12">{children}</div>
  </main>;
}

function TarotBrand() {
  return <div className="flex items-center gap-3"><span className="relative grid h-10 w-10 place-items-center rounded-full border border-[#b69561] text-[#dbc18e]"><Moon className="h-5 w-5" fill="currentColor" strokeWidth={1.2} /><Star className="absolute right-1 top-1 h-2.5 w-2.5" fill="currentColor" /></span><span className="font-display text-2xl leading-none"><b>Mara</b> <em className="font-normal text-[#d7ba82]">Tarot</em></span></div>;
}

function TarotLegalLine() {
  return <p className="mx-auto mt-10 max-w-3xl text-center text-xs leading-5 text-[#9d9eaa]">Tarotul poate susține reflecția personală. Nu este sfat medical, psihologic, juridic sau financiar și nu garantează rezultate.</p>;
}

export function TarotLanding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"cards" | "topic" | "details">("cards");
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [topic, setTopic] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const checkout = trpc.tarot.startCheckout.useMutation();
  const selectedTopic = topics.find((item) => item.id === topic);
  const isReady = selectedCards.length === 3 && Boolean(selectedTopic) && name.trim().length >= 2 && /^\S+@\S+\.\S+$/.test(email) && Boolean(birthDate);

  const chooseCard = (id: string) => {
    if (selectedCards.includes(id) || selectedCards.length >= 3) return;
    setSelectedCards((current) => [...current, id]);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isReady || !selectedTopic) return;
    try {
      const result = await checkout.mutateAsync({ customerName: name.trim(), customerEmail: email.trim(), birthDate, topic: selectedTopic.title, selectedCards, marketingConsent });
      window.open(result.checkoutUrl, "_blank", "noopener,noreferrer");
      toast.success("Deschidem checkout-ul securizat într-o filă nouă.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nu am putut pregăti checkout-ul.");
    }
  };

  return <TarotShell>
    <header className="flex items-center justify-between border-b border-[#313744] pb-5"><TarotBrand /><Link href="/" className="text-xs font-bold tracking-[.14em] text-[#bdb4a5] hover:text-[#d7ba82]">ÎNAPOI LA CATALOG</Link></header>
    <section className="mx-auto max-w-5xl py-12 sm:py-18">
      {step === "cards" && <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
        <p className="text-center text-xs font-bold tracking-[.16em] text-[#d7ba82]">PASUL 1 / ALEGE 3 CĂRȚI</p>
        <h1 className="mx-auto mt-5 max-w-3xl text-center font-display text-5xl leading-[.93] tracking-[-.05em] sm:text-7xl">Alege trei cărți <em className="font-normal text-[#d7ba82]">cu fața în jos.</em></h1>
        <p className="mx-auto mt-6 max-w-xl text-center leading-7 text-[#c4c1c4]">Alege intuitiv. După a treia carte poți continua spre contextul pentru care vrei ghidul.</p>
        <div className="mt-8 flex justify-center gap-2"><span className="text-sm text-[#b9b2a8]">{selectedCards.length} din 3 alese</span>{[0, 1, 2].map((index) => <span key={index} className={`h-2 w-8 rounded-full ${selectedCards[index] ? "bg-[#d7ba82]" : "bg-[#3b424e]"}`} />)}</div>
        <div className="mx-auto mt-11 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
          {cards.map((card) => { const selected = selectedCards.includes(card.id); const position = selectedCards.indexOf(card.id) + 1; return <button type="button" key={card.id} onClick={() => chooseCard(card.id)} className={`group min-h-48 border p-4 text-left transition sm:min-h-64 ${selected ? "border-[#d7ba82] bg-[#202534]" : "border-[#343a47] bg-[#171b26] hover:-translate-y-1 hover:border-[#9d875b]"}`}><span className="flex justify-between text-xs font-bold tracking-[.13em] text-[#d7ba82]"><span>{selected ? `ALEASA ${position}` : "ALEGERE"}</span><span>{card.glyph}</span></span><span className="mt-12 block text-center font-display text-5xl text-[#ebe0c8]">{selected ? card.glyph : "✦"}</span><span className="mt-8 block text-center text-sm font-semibold">{selected ? card.name : "Carte închisă"}</span></button>; })}
        </div>
        <div className="mt-10 flex justify-end"><button type="button" disabled={selectedCards.length !== 3} onClick={() => setStep("topic")} className="inline-flex items-center gap-2 bg-[#d7ba82] px-6 py-4 text-sm font-bold text-[#181a22] transition enabled:hover:bg-[#f0d299] disabled:cursor-not-allowed disabled:opacity-40">CONTINUĂ <ArrowRight className="h-4 w-4" /></button></div>
      </div>}
      {step === "topic" && <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
        <button type="button" onClick={() => setStep("cards")} className="inline-flex items-center gap-2 text-xs font-bold tracking-[.13em] text-[#bdb4a5] hover:text-[#d7ba82]"><ArrowLeft className="h-4 w-4" /> ÎNAPOI</button>
        <p className="mt-10 text-xs font-bold tracking-[.16em] text-[#d7ba82]">PASUL 2 / ALEGE CONTEXTUL</p><h1 className="mt-5 max-w-3xl font-display text-5xl leading-[.95] tracking-[-.05em] sm:text-7xl">În ce zonă simți cea mai mare <em className="font-normal text-[#d7ba82]">dificultate?</em></h1>
        <div className="mt-10 grid gap-4 md:grid-cols-2">{topics.map(({ id, title, subtitle, icon: Icon }) => <button type="button" key={id} onClick={() => setTopic(id)} className={`flex items-center gap-5 border p-6 text-left transition ${topic === id ? "border-[#d7ba82] bg-[#202534]" : "border-[#343a47] bg-[#171b26] hover:border-[#9d875b]"}`}><Icon className="h-6 w-6 text-[#d7ba82]" /><span><b className="block text-lg">{title}</b><small className="mt-1 block text-sm text-[#acabb1]">{subtitle}</small></span>{topic === id && <Check className="ml-auto h-5 w-5 text-[#d7ba82]" />}</button>)}</div>
        <p className="mt-6 flex items-center gap-2 text-sm text-[#bcb9bb]"><LockKeyhole className="h-4 w-4 text-[#d7ba82]" /> Tarotul nu pune diagnostice și nu ia decizii în locul tău.</p>
        <div className="mt-10 flex justify-end"><button type="button" disabled={!topic} onClick={() => setStep("details")} className="inline-flex items-center gap-2 bg-[#d7ba82] px-6 py-4 text-sm font-bold text-[#181a22] transition enabled:hover:bg-[#f0d299] disabled:cursor-not-allowed disabled:opacity-40">CONTINUĂ <ArrowRight className="h-4 w-4" /></button></div>
      </div>}
      {step === "details" && <div className="animate-in fade-in slide-in-from-bottom-3 duration-500"><button type="button" onClick={() => setStep("topic")} className="inline-flex items-center gap-2 text-xs font-bold tracking-[.13em] text-[#bdb4a5] hover:text-[#d7ba82]"><ArrowLeft className="h-4 w-4" /> ÎNAPOI</button><div className="mt-10 grid gap-10 lg:grid-cols-[.9fr_1.1fr]"><div><p className="text-xs font-bold tracking-[.16em] text-[#d7ba82]">PASUL 3 / DATE DE LIVRARE</p><h1 className="mt-5 font-display text-5xl leading-[.95] tracking-[-.05em] sm:text-6xl">Citește-mi în tarot despre <em className="font-normal text-[#d7ba82]">{selectedTopic?.title.toLowerCase()}.</em></h1><p className="mt-6 leading-7 text-[#c4c1c4]">Datele sunt folosite pentru comandă și pentru pregătirea ghidului. Acordul pentru noutăți este opțional.</p><div className="mt-10 grid grid-cols-3 gap-3">{cards.filter((card) => selectedCards.includes(card.id)).map((card) => <div key={card.id} className="border border-[#3a404b] bg-[#171b26] p-4 text-center"><span className="font-display text-3xl text-[#d7ba82]">{card.glyph}</span><span className="mt-2 block text-xs font-bold tracking-[.08em]">{card.name}</span></div>)}</div></div><form onSubmit={submit} className="border border-[#343a47] bg-[#171b26] p-6 sm:p-8"><h2 className="font-display text-3xl">Date pentru ghid</h2><div className="mt-6 grid gap-4"><label className="text-sm font-semibold">Numele complet<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="De exemplu, Andrei Popescu" className="mt-2 w-full border border-[#414856] bg-[#10131c] px-4 py-3 text-[#f5efe3] outline-none placeholder:text-[#797d89] focus:border-[#d7ba82]" /></label><label className="text-sm font-semibold">Emailul tău<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nume@exemplu.ro" className="mt-2 w-full border border-[#414856] bg-[#10131c] px-4 py-3 text-[#f5efe3] outline-none placeholder:text-[#797d89] focus:border-[#d7ba82]" /></label><label className="text-sm font-semibold">Data de naștere<input required type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} className="mt-2 w-full border border-[#414856] bg-[#10131c] px-4 py-3 text-[#f5efe3] outline-none focus:border-[#d7ba82] [color-scheme:dark]" /></label></div><label className="mt-6 flex gap-3 border-t border-[#343a47] pt-5 text-sm text-[#bfbdc2]"><input type="checkbox" checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} className="mt-1 h-4 w-4 accent-[#d7ba82]" /><span><b className="block text-[#f5efe3]">Vreau și noutăți despre produsele complementare.</b><span className="mt-1 block">Opțional. Fără acord, primești doar e-mailurile necesare comenzii.</span></span></label><button disabled={!isReady || checkout.isPending} className="mt-7 inline-flex w-full items-center justify-center gap-2 bg-[#d7ba82] px-6 py-4 text-sm font-bold text-[#181a22] transition enabled:hover:bg-[#f0d299] disabled:cursor-not-allowed disabled:opacity-40">{checkout.isPending ? "PREGĂTIM CHECKOUT-UL…" : "CITEȘTE-MI ÎN TAROT · 57 LEI"}<ArrowRight className="h-4 w-4" /></button><p className="mt-4 flex items-center gap-2 text-xs text-[#a9a6ac]"><LockKeyhole className="h-3.5 w-3.5 text-[#d7ba82]" /> Checkout securizat prin Stripe.</p></form></div></div>}
    </section><TarotLegalLine />
  </TarotShell>;
}

export function TarotOffer({ offerKey }: { offerKey: OfferKey }) {
  const [, setLocation] = useLocation();
  const offer = offers[offerKey];
  const checkoutToken = useMemo(() => new URLSearchParams(window.location.search).get("token") ?? "", []);
  const checkout = trpc.tarot.startOfferCheckout.useMutation();
  const continueWithout = () => setLocation(`${offer.next}?token=${encodeURIComponent(checkoutToken)}`);
  const addOffer = async () => { if (!checkoutToken) return toast.error("Lipsește sesiunea de comandă."); try { const result = await checkout.mutateAsync({ checkoutToken, productKey: offerKey }); window.open(result.checkoutUrl, "_blank", "noopener,noreferrer"); toast.success("Deschidem checkout-ul securizat într-o filă nouă."); } catch (error) { toast.error(error instanceof Error ? error.message : "Oferta nu a putut fi pregătită."); } };
  return <TarotShell><header className="flex items-center justify-between border-b border-[#313744] pb-5"><TarotBrand /><span className="text-xs font-bold tracking-[.14em] text-[#bdb4a5]">OFERTĂ OPȚIONALĂ</span></header><section className="mx-auto grid max-w-5xl gap-8 py-16 lg:grid-cols-[.82fr_1.18fr]"><div className="border border-[#3b424f] bg-[#171b26] p-8"><span className="grid h-11 w-11 place-items-center border border-[#d7ba82] text-[#d7ba82]"><Sparkles className="h-5 w-5" /></span><p className="mt-16 text-xs font-bold tracking-[.16em] text-[#d7ba82]">{offer.eyebrow.toUpperCase()} / OPȚIONAL</p><p className="mt-5 font-display text-4xl leading-tight">O alegere în plus, doar dacă simți că te ajută.</p></div><div className="border-y border-[#3a404b] py-8"><h1 className="font-display text-5xl leading-[.92] tracking-[-.05em] sm:text-6xl">{offer.title} <em className="font-normal text-[#d7ba82]">· {offer.price}</em></h1><p className="mt-6 max-w-xl text-lg leading-8 text-[#c4c1c4]">{offer.lead}</p><div className="mt-9 border-t border-[#3a404b] pt-6"><p className="text-xs font-bold tracking-[.15em] text-[#d7ba82]">CE SE ADAUGĂ</p>{offer.includes.map((item) => <p key={item} className="mt-4 flex gap-3 text-sm text-[#dfdde0]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#d7ba82]" />{item}</p>)}</div><div className="mt-10 flex flex-col gap-3 sm:flex-row"><button type="button" disabled={checkout.isPending} onClick={continueWithout} className="border border-[#4a505c] px-5 py-4 text-xs font-bold tracking-[.1em] text-[#ddd9d1] hover:border-[#d7ba82]">NU ACUM, CONTINUĂ</button><button type="button" disabled={checkout.isPending} onClick={addOffer} className="inline-flex items-center justify-center gap-2 bg-[#d7ba82] px-5 py-4 text-xs font-bold tracking-[.1em] text-[#181a22] hover:bg-[#f0d299]">{checkout.isPending ? "PREGĂTIM…" : `DA, ADAUGĂ PENTRU ${offer.price.toUpperCase()}`}<ArrowRight className="h-4 w-4" /></button></div></div></section><TarotLegalLine /></TarotShell>;
}

export function TarotThankYou() { return <TarotShell><header className="flex items-center justify-between border-b border-[#313744] pb-5"><TarotBrand /><span className="text-xs font-bold tracking-[.14em] text-[#bdb4a5]">COMANDĂ CONFIRMATĂ</span></header><section className="mx-auto max-w-3xl py-24 text-center"><CircleCheck className="mx-auto h-12 w-12 text-[#d7ba82]" /><p className="mt-7 text-xs font-bold tracking-[.16em] text-[#d7ba82]">AI AJUNS LA FINAL</p><h1 className="mt-5 font-display text-6xl leading-[.9] tracking-[-.06em] sm:text-7xl">Mulțumim pentru <em className="font-normal text-[#d7ba82]">încredere.</em></h1><p className="mx-auto mt-7 max-w-xl leading-7 text-[#c4c1c4]">Comanda a fost înregistrată. Accesul și pașii următori vor fi trimiși pe e-mailul folosit la comandă, cu identitatea Mara Tarot.</p><Link href="/oferte/tarot/dashboard" className="mt-10 inline-flex items-center gap-2 bg-[#d7ba82] px-6 py-4 text-sm font-bold text-[#181a22] hover:bg-[#f0d299]">VEZI BIBLIOTECA <ArrowRight className="h-4 w-4" /></Link></section></TarotShell>; }

export function TarotAccess() {
  const [, setLocation] = useLocation();
  const redeem = trpc.tarot.redeemAccess.useMutation();
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token") ?? "", []);
  useEffect(() => { if (!token) return; redeem.mutate({ token }, { onSuccess: () => setLocation("/oferte/tarot/dashboard"), onError: () => toast.error("Linkul de acces nu mai este valid.") }); }, [token, redeem, setLocation]);
  return <TarotShell><section className="mx-auto max-w-xl py-32 text-center"><TarotBrand /><p className="mt-12 text-xs font-bold tracking-[.16em] text-[#d7ba82]">VALIDĂM ACCESUL</p><h1 className="mt-5 font-display text-5xl">Pregătim biblioteca ta.</h1><p className="mt-5 text-[#c4c1c4]">{token ? "Verificăm linkul privat primit pe e-mail." : "Linkul de acces lipsește."}</p></section></TarotShell>;
}

export function TarotDashboard() { const library = trpc.tarot.library.useQuery(); return <TarotShell><header className="flex items-center justify-between border-b border-[#313744] pb-5"><TarotBrand /><Link href="/oferte/tarot" className="text-xs font-bold tracking-[.14em] text-[#bdb4a5] hover:text-[#d7ba82]">ACASĂ</Link></header><section className="mx-auto max-w-4xl py-16"><p className="text-xs font-bold tracking-[.16em] text-[#d7ba82]">BIBLIOTECA MEA</p><h1 className="mt-5 font-display text-6xl tracking-[-.06em]">Accesul tău.</h1>{library.isLoading ? <p className="mt-9 text-[#c4c1c4]">Încărcăm produsele tale…</p> : !library.data?.access ? <div className="mt-9 border border-[#3a404b] bg-[#171b26] p-8"><LockKeyhole className="h-7 w-7 text-[#d7ba82]" /><h2 className="mt-6 font-display text-3xl">Biblioteca se deschide din linkul privat.</h2><p className="mt-3 max-w-2xl leading-7 text-[#c4c1c4]">Folosește linkul primit pe e-mail pentru a valida dispozitivul. După activare, aici apar doar produsele cumpărate.</p></div> : <div className="mt-9 grid gap-4">{library.data.products.map((product) => <div key={product.productId} className="border border-[#3a404b] bg-[#171b26] p-7"><CircleCheck className="h-6 w-6 text-[#d7ba82]" /><h2 className="mt-4 font-display text-3xl">{product.displayName}</h2><p className="mt-2 max-w-2xl text-[#c4c1c4]">{product.description}</p><p className="mt-5 text-sm text-[#9f9ca1]">Conținutul livrabil va fi disponibil aici după configurarea materialelor brandului.</p></div>)}</div>}</section></TarotShell>; }
