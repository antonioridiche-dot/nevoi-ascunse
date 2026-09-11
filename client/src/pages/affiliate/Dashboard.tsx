import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, DollarSign, Link2, Copy, TrendingUp, LogOut, MousePointerClick, Percent, BarChart3, HelpCircle, Star, Wallet, Mail } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { getAffiliateToken, clearAffiliateSession } from "@/lib/affiliateSession";

/** Praguri de retragere, in lei (identice cu serverul):
 *  - Stripe: transfer AUTOMAT la 50 lei scadenți; butonul manual merge fără prag.
 *  - Manual (IBAN): minim 50 lei, ca sa merite transferul bancar. */
const MIN_STRIPE_LEI = 0;
const MIN_AUTO_STRIPE_LEI = 50;
const MIN_MANUAL_LEI = 50;

/** Alte oferte pe care afiliatii le pot promova. Ca sa adaugi una noua,
 *  inlocuiesti un "null" cu { href, img, title, desc } si pui imaginea in
 *  client/public/img/alte-oferte/. Ordinea de afisare e pe grila 2x2. */
type Oferta = { href: string; img: string; title: string; desc: string };
const ALTE_OFERTE: (Oferta | null)[] = [
  {
    href: "https://parintedesucces.ro/afiliere",
    img: "/img/alte-oferte/parintedesucces-afiliere.jpg",
    title: "ParinteDesucces.ro",
    desc: "Aceeași schemă de comision, 50% la fiecare produs din funnel-ul lor. Vezi toate detaliile și pachetele pe pagina lor de afiliere.",
  },
  null, // oferta 2 — in dreapta
  null, // oferta 3 — randul 2
  null, // oferta 4 — randul 2
];

export default function AffiliateDashboardPage() {
  const [, navigate] = useLocation();
  // Dovada de intrare in cont e token-ul de sesiune, nu un id care se poate ghici.
  const [token] = useState<string>(() => getAffiliateToken());

  if (!token) {
    navigate("/affiliate/login");
    return null;
  }

  return <DashboardContent token={token} />;
}

function RON(n: number): string { return (Math.round(n * 100) / 100).toFixed(2).replace(".", ","); }

function DashboardContent({ token }: { token: string }) {
  const [, navigate] = useLocation();
  const logoutMut = trpc.affiliates.logout.useMutation();
  const { data, isLoading, error, refetch } = trpc.affiliates.dashboard.useQuery({ token });
  const connectStart = trpc.affiliates.connectStart.useMutation();
  const withdrawMut = trpc.affiliates.withdraw.useMutation();
  const connectLoginMut = trpc.affiliates.connectLogin.useMutation();
  const updMethod = trpc.affiliates.updatePayoutMethod.useMutation();
  const requestPay = trpc.affiliates.requestManualPayout.useMutation();
  const [payoutDetails, setPayoutDetails] = useState("");
  const [savingMethod, setSavingMethod] = useState(false);
  const [requestingPay, setRequestingPay] = useState(false);

  useEffect(() => {
    if (!data) return;
    setPayoutDetails((data.affiliate.payoutDetails as string) || "");
  }, [data ? data.affiliate.payoutDetails : null]);

  // Daca serverul ne spune ca sesiunea nu mai e valida (expirata sau revocata),
  // curatam token-ul si trimitem afiliatul la conectare.
  useEffect(() => {
    if (isLoading || !error) return;
    const e = error as { message?: string; data?: { code?: string } };
    if (e?.data?.code === "UNAUTHORIZED" || /UNAUTHORIZED|Sesiunea a expirat/i.test(String(e?.message || ""))) {
      clearAffiliateSession();
      toast.error("Sesiunea a expirat. Intră din nou cu codul primit pe email.");
      navigate("/affiliate/login");
    }
  }, [error, isLoading, navigate]);
  const [connecting, setConnecting] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const [connectBlocked, setConnectBlocked] = useState(false);
  const startConnect = async () => {
    setConnecting(true);
    try {
      const result = await connectStart.mutateAsync({ token, origin: window.location.origin });
      window.location.href = result.url;
    } catch (err: any) {
      const msg = String(err?.message || "");
      if (/signed up for Connect|connect/i.test(msg)) {
        // Stripe Connect nu e inca activat pe contul magazinului — pas unic facut
        // de administrator, nu de afiliat.
        setConnectBlocked(true);
        toast.error("Plățile automate nu sunt încă activate de magazin. Vezi explicația de mai jos.");
      } else {
        toast.error(err?.message || "Nu am putut porni conectarea Stripe.");
      }
      setConnecting(false);
    }
  };

  const links = useMemo(() => {
    const base = window.location.origin;
    const code = data ? data.affiliate.referralCode : "";
    if (!code) return [];
    return [
      { key: "quiz", label: "Testul de șanse de împăcare (gender neutral)", desc: "Cel mai bun link pentru conținut general: oricine îl face află ce șanse de împăcare mai are, apoi ajunge la cartea potrivită lui/ei.", href: base + "/test-impacare?ref=" + code },
      { key: "barbati", label: "Cum să Oprești Durerea unei Despărțiri — pagina bărbați", desc: "Direct pe pagina de vânzare pentru bărbați.", href: base + "/barbati/biblie?ref=" + code },
      { key: "femei", label: "Cum să Oprești Durerea unei Despărțiri — pagina femei", desc: "Direct pe pagina de vânzare pentru femei.", href: base + "/femei/biblie?ref=" + code },
    ];
  }, [data]);

  const copyLink = (url: string, label: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(url);
      toast.success("Link copiat: " + label);
      setTimeout(() => setCopied(null), 2000);
    }).catch(() => toast.error("Nu am putut copia. Selectează linkul manual."));
  };

  const logout = async () => {
    // Stergem sesiunea si pe server, nu doar in browser: token-ul devine inutil imediat.
    try { await logoutMut.mutateAsync({ token }); } catch { /* iesim oricum local */ }
    clearAffiliateSession();
    navigate("/affiliate/login");
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-screen bg-[#f0f3f8]"><Loader2 className="animate-spin w-8 h-8 text-[#1b2d4f]" /></div>;
  if (!data) return <div className="text-center p-8">Eroare la incarcarea datelor</div>;

  const s = data.stats;
  const pct = data.affiliate.commissionPercent || 50;
  const fmt = (x: number) => RON(x);

  const connectStatus = (data.affiliate.connectStatus || "none") as string;
  // Metoda salvata in baza de date (un singur punct de adevar). Pentru afiliatii
  // vechi, fara metoda salvata: Stripe daca au contul conectat, altfel IBAN.
  const savedMethod = ((data.affiliate.payoutMethod as string) || (connectStatus === "active" ? "stripe" : "iban"));
  const isStripe = savedMethod === "stripe";
  const stripeReady = isStripe && connectStatus === "active";
  const inAsteptare = Math.max(0, s.pendingPayout - s.withdrawable);
  const canWithdrawStripe = s.withdrawable > MIN_STRIPE_LEI;
  const canWithdrawManual = s.withdrawable >= MIN_MANUAL_LEI;
  const missingManual = Math.max(0, MIN_MANUAL_LEI - s.withdrawable);

  // Conversia lead -> vanzare (din lead-urile captate, cate au cumparat).
  const leadConv = s.totalReferrals > 0 ? Math.round((s.totalSales / s.totalReferrals) * 1000) / 10 : 0;

  // Soldul din contul Stripe al afiliatului (in lei).
  const balPending = data.connectBalance ? data.connectBalance.pending / 100 : null;

  const saveMethod = async (method: "stripe" | "iban") => {
    if (savingMethod) return;
    setSavingMethod(true);
    try {
      await updMethod.mutateAsync({ token, method, details: method === "iban" ? payoutDetails : undefined });
      toast.success(method === "stripe"
        ? "Gata — de acum ești plătit automat prin Stripe."
        : "Gata — de acum primești banii prin transfer bancar (IBAN).");
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || "Nu am putut salva metoda de plată.");
    } finally { setSavingMethod(false); }
  };

  const doWithdraw = async () => {
    if (withdrawing) return;
    setWithdrawing(true);
    try {
      const res = await withdrawMut.mutateAsync({ token });
      toast.success("Retragere trimisă: " + fmt(res.transferred) + " RON. Banii ajung în contul tău bancar în 1–2 zile lucrătoare.");
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || "Nu am putut procesa retragerea acum.");
    } finally { setWithdrawing(false); }
  };

  const doRequestManual = async () => {
    if (requestingPay) return;
    setRequestingPay(true);
    try {
      const res = await requestPay.mutateAsync({ token });
      toast.success("Cerere trimisă: " + fmt(res.amount) + " RON prin " + res.method + ". Primești un email când banii au plecat.");
    } catch (err: any) {
      toast.error(err?.message || "Nu am putut trimite cererea.");
    } finally { setRequestingPay(false); }
  };

  return (
    <div className="min-h-screen bg-[#f0f3f8]">
      <header className="bg-white border-b border-[#dde3ef] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1b2d4f] font-['Playfair_Display']">Panou Afiliat</h1>
          <p className="text-sm text-[#64748b]">Bine ai venit, {data.affiliate.name}</p>
          <span className={"inline-flex items-center gap-1.5 mt-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border " + (isStripe ? "bg-[#eef2ff] text-[#1b2d4f] border-[#1b2d4f]/25" : "bg-[#fdf6e3] text-[#8a6a12] border-[#c9a44a]/40")}>
            <Wallet className="w-3.5 h-3.5" />
            Primești banii {isStripe ? "automat, prin Stripe" : "manual, prin transfer bancar (IBAN)"}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={logout} className="text-[#64748b]"><LogOut className="w-4 h-4 mr-2" /> Deconectare</Button>
      </header>

      <main className="p-6 max-w-6xl mx-auto space-y-6">

        {/* ============ 1. COMISIOANELE TALE ============ */}
        <Card>
          <CardHeader><CardTitle className="text-base text-[#1b2d4f]">Comisioanele Tale</CardTitle></CardHeader>
          <CardContent>
            {data.recentCommissions.length === 0 ? (
              <div className="text-center py-8"><DollarSign className="w-12 h-12 mx-auto text-[#dde3ef] mb-3" /><p className="text-[#64748b]">Nu ai comisioane încă. Copiază un link de mai jos și începe să promovezi!</p></div>
            ) : (
              <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-[#f0f3f8] border-b"><tr><th className="px-4 py-3 text-left text-[#64748b] font-medium">Data</th><th className="px-4 py-3 text-left text-[#64748b] font-medium">Suma</th><th className="px-4 py-3 text-left text-[#64748b] font-medium">Status</th><th className="px-4 py-3 text-left text-[#64748b] font-medium">Platibil la</th></tr></thead><tbody>{data.recentCommissions.map((c: any) => (<tr key={c.id} className="border-b border-[#f0f3f8]"><td className="px-4 py-3">{new Date(c.createdAt).toLocaleDateString("ro-RO")}</td><td className="px-4 py-3 font-semibold text-[#1b2d4f]">{(c.amountInCents / 100).toFixed(2).replace(".", ",")} RON</td><td className="px-4 py-3"><Badge className={c.status === "paid" ? "bg-green-100 text-green-800" : c.status === "approved" ? "bg-blue-100 text-blue-800" : c.status === "cancelled" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}>{c.status === "pending" ? "In asteptare" : c.status === "approved" ? "Aprobat" : c.status === "paid" ? "Platit" : "Anulat"}</Badge></td><td className="px-4 py-3 text-[#64748b]">{c.payableAt ? new Date(c.payableAt).toLocaleDateString("ro-RO") : "—"}</td></tr>))}</tbody></table></div>
            )}
          </CardContent>
        </Card>

        {/* ============ 2. STATISTICI ============ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-5 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0"><MousePointerClick className="w-5 h-5 text-blue-500" /></div><div className="min-w-0"><p className="text-sm text-[#64748b]">Click-uri pe linkuri</p><p className="text-2xl font-bold text-[#1b2d4f]">{s.clicks}</p></div></CardContent></Card>
          <Card><CardContent className="p-5 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0"><Percent className="w-5 h-5 text-green-600" /></div><div className="min-w-0"><p className="text-sm text-[#64748b]">Conversie (click → vânzare)</p><p className="text-2xl font-bold text-[#1b2d4f]">{s.conversionRate}%</p></div></CardContent></Card>
          <Card><CardContent className="p-5 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center shrink-0"><BarChart3 className="w-5 h-5 text-cyan-600" /></div><div className="min-w-0"><p className="text-sm text-[#64748b]">EPC (câștig / click)</p><p className="text-2xl font-bold text-[#1b2d4f]">{fmt(s.epc)} RON</p></div></CardContent></Card>
          <Card><CardContent className="p-5 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0"><TrendingUp className="w-5 h-5 text-orange-500" /></div><div className="min-w-0"><p className="text-sm text-[#64748b]">Suma medie / comandă</p><p className="text-2xl font-bold text-[#1b2d4f]">{fmt(s.avgOrder)} RON</p></div></CardContent></Card>
        </div>
        {/* Randul 2: tot performanta (cati oameni, cate vanzari). Cifrele de BANI
            (total castigat / disponibil / in asteptare / platit) apar o singura data,
            in cardul "Banii tai" de mai jos. */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-5 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0"><Users className="w-5 h-5 text-indigo-500" /></div><div><p className="text-sm text-[#64748b]">Lead-uri (emailuri captate)</p><p className="text-2xl font-bold text-[#1b2d4f]">{s.totalReferrals}</p></div></CardContent></Card>
          <Card><CardContent className="p-5 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center shrink-0"><Percent className="w-5 h-5 text-teal-600" /></div><div><p className="text-sm text-[#64748b]">Conversie (lead → vânzare)</p><p className="text-2xl font-bold text-[#1b2d4f]">{leadConv}%</p></div></CardContent></Card>
          <Card><CardContent className="p-5 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0"><DollarSign className="w-5 h-5 text-[#c9a44a]" /></div><div><p className="text-sm text-[#64748b]">Vânzări</p><p className="text-2xl font-bold text-[#1b2d4f]">{s.totalSales}</p></div></CardContent></Card>
          <Card><CardContent className="p-5 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0"><TrendingUp className="w-5 h-5 text-rose-500" /></div><div><p className="text-sm text-[#64748b]">Rata de rambursări</p><p className="text-2xl font-bold text-[#1b2d4f]">{s.refundRate}%</p></div></CardContent></Card>
        </div>

        {/* ============ 3. BANII TAI ============ */}
        <Card className="border-[#1b2d4f]/30 bg-white">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 flex-wrap text-[#1b2d4f]">
              <Wallet className="w-5 h-5 text-[#c9a44a]" /> Banii tăi
              <span className={"ml-auto inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border " + (isStripe ? "bg-[#eef2ff] text-[#1b2d4f] border-[#1b2d4f]/25" : "bg-[#fdf6e3] text-[#8a6a12] border-[#c9a44a]/40")}>
                <Wallet className="w-3.5 h-3.5" />
                {isStripe ? "Metoda ta: Stripe (automat)" : "Metoda ta: IBAN (transfer bancar)"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Toate cifrele de bani, o singura data fiecare. */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4">
                <p className="text-xs text-[#64748b]">Total câștigat</p>
                <p className="text-2xl font-extrabold text-[#1b2d4f]">{fmt(s.totalEarned)} RON</p>
              </div>
              <div className="bg-[#eef2ff] border-2 border-[#1b2d4f]/25 rounded-xl p-4">
                <p className="text-xs font-bold text-[#1b2d4f]">Disponibil de retras (scadent)</p>
                <p className="text-2xl font-extrabold text-[#1b2d4f]">{fmt(s.withdrawable)} RON</p>
              </div>
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4">
                <p className="text-xs text-[#64748b]">În așteptare</p>
                <p className="text-2xl font-extrabold text-[#1b2d4f]">{fmt(inAsteptare)} RON</p>
                <p className="text-[10px] text-[#94a3b8] mt-0.5">devine scadent la 31 de zile de la fiecare vânzare — datele exacte în „Comisioanele Tale”</p>
              </div>
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4">
                <p className="text-xs text-[#64748b]">Plătit până acum</p>
                <p className="text-2xl font-extrabold text-[#15803d]">{fmt(s.totalPaid)} RON</p>
              </div>
            </div>

            {/* --- Butonul: depinde de metoda aleasa --- */}
            {isStripe ? (
              connectStatus === "active" ? (
                <div className="space-y-2">
                  <button
                    onClick={doWithdraw}
                    disabled={withdrawing || !canWithdrawStripe}
                    className="w-full sm:w-auto bg-[#1b2d4f] hover:bg-[#2d4a7a] text-white text-sm font-bold py-3 px-8 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {withdrawing ? "Se procesează..." : "Retrage acum →"}
                  </button>
                  {s.withdrawable <= 0 && (
                    <p className="text-[11px] text-[#94a3b8]">Nu ai încă sume scadente. Comisioanele devin disponibile la 31 de zile de la fiecare achiziție — atunci butonul se activează automat.</p>
                  )}
                  {s.withdrawable > 0 && (
                    <p className="text-[11px] text-[#94a3b8]">Când ajungi la {MIN_AUTO_STRIPE_LEI} lei scadenți, transferul pleacă <strong>automat</strong> — nu trebuie să apeși nimic. Dacă vrei mai repede, apeși butonul și retragi orice sumă, fără prag minim. Primești email de la noi când suma intră în contul Stripe, plus emailul de la Stripe când pleacă spre bancă.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-[#64748b]">
                    {connectStatus === "restricted"
                      ? "Contul tău Stripe are o problemă — verifică detaliile sau reconectează-l."
                      : connectStatus === "pending"
                        ? "Onboarding-ul Stripe e în curs — continuă-l ca să activezi plățile automate."
                        : "Conectează-ți contul Stripe (~5 minute, o singură dată) ca să poți retrage banii direct de aici."}
                  </p>
                  <Button onClick={startConnect} disabled={connecting} className="bg-[#1b2d4f] hover:bg-[#2d4a7a]">
                    {connecting ? "Se pregătește..." : connectStatus === "restricted" ? "Reconectează contul Stripe" : connectStatus === "pending" ? "Continuă onboarding-ul Stripe" : "Conectează contul Stripe (automat)"}
                  </Button>
                </div>
              )
            ) : (
              <div className="space-y-2">
                <button
                  onClick={doRequestManual}
                  disabled={requestingPay || !canWithdrawManual}
                  className="w-full sm:w-auto bg-gradient-to-r from-[#b8860b] to-[#c9a44a] text-white text-sm font-extrabold py-3 px-8 rounded-full shadow disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {requestingPay ? "Se trimite..." : "Solicită plata →"}
                </button>
                {!canWithdrawManual && s.withdrawable > 0 && (
                  <p className="text-[11px] text-[#94a3b8]">Mai trebuie {fmt(missingManual)} RON până la pragul minim de {MIN_MANUAL_LEI} lei pentru transfer bancar.</p>
                )}
                {s.withdrawable <= 0 && (
                  <p className="text-[11px] text-[#94a3b8]">Nu ai încă sume scadente. Comisioanele devin disponibile la 31 de zile de la fiecare achiziție.</p>
                )}
                <p className="text-[11px] text-[#94a3b8]">
                  Cum funcționează: apeși butonul → primesc eu un email cu IBAN-ul tău și suma → fac transferul în 1–3 zile lucrătoare → primești un al doilea email când banii au plecat, iar comisioanele trec pe „Plătit”.
                </p>
              </div>
            )}

            {/* --- Soldul din contul Stripe (doar la metoda Stripe, cont conectat) --- */}
            {stripeReady && (
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4">
                <p className="text-xs text-[#64748b]">În contul tău Stripe (în drum spre bancă)</p>
                {data.connectBalance ? (
                  <>
                    <p className="text-xl font-extrabold text-[#1b2d4f]">{fmt((data.connectBalance.available + Math.max(0, data.connectBalance.pending)) / 100)} RON</p>
                    <p className="text-[11px] text-[#94a3b8]">
                      disponibil: {fmt(Math.max(0, data.connectBalance.available) / 100)} RON
                      {balPending !== null && balPending > 0 ? " · în tranzit: " + fmt(balPending) + " RON" : ""}
                      {balPending !== null && balPending < 0 ? " · " + fmt(Math.abs(balPending)) + " RON pleacă spre banca ta" : ""}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-[#94a3b8]">momentan indisponibil</p>
                )}
                <button
                  onClick={async () => {
                    try {
                      const res = await connectLoginMut.mutateAsync({ token });
                      window.open(res.url, "_blank", "noopener");
                    } catch (err: any) {
                      toast.error(err?.message || "Nu am putut genera linkul.");
                    }
                  }}
                  className="mt-2 w-full sm:w-auto text-center border border-[#1b2d4f] text-[#1b2d4f] hover:bg-[#1b2d4f] hover:text-white text-xs font-bold py-2 px-4 rounded-full transition-colors"
                >
                  Deschide pagina Stripe (cont bancar / verificări)
                </button>
              </div>
            )}

            {connectBlocked && (
              <div className="bg-[#fffbeb] border border-[#f0d98a] rounded-lg p-3 text-xs text-[#7a5b12] leading-relaxed">
                <p className="font-bold mb-1">De ce apare această eroare</p>
                <p>Plățile automate prin Stripe Connect trebuie activate <strong>o singură dată de administratorul magazinului</strong> (nu de afiliat), direct în contul Stripe al magazinului. Până atunci, poți oricând primi banii <strong>manual, prin transfer bancar</strong> — scrie-mi la <a href="mailto:anca@pestedespartire.ro" className="underline font-semibold">anca@pestedespartire.ro</a> și o rezolvăm imediat. (Dacă ești administratorul magazinului: <a href="https://dashboard.stripe.com/connect" target="_blank" rel="noopener noreferrer" className="underline font-semibold">activează Connect aici</a>, apoi reîncearcă.)</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ============ 4. DE CE SA PROMOVEZI ============ */}
        <Card className="border-[#c9a44a]/30 bg-[#f8f5ec]">
          <CardHeader><CardTitle className="text-base flex items-center gap-2 text-[#1b2d4f]"><Star className="w-5 h-5 text-[#c9a44a]" /> De ce să promovezi Peste Despărțire</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-[#334155]">
            <ul className="space-y-2.5">
              <li className="flex gap-2"><span className="text-[#15803d] shrink-0">✔</span><span><strong>Funnel de vânzare optimizat</strong> — fiecare pas e testat și îmbunătățit constant ca să convertească, nu lăsat la voia întâmplării.</span></li>
              <li className="flex gap-2"><span className="text-[#15803d] shrink-0">✔</span><span><strong>Versiuni separate pentru bărbați și femei</strong>, fiecare cu pagina ei de vânzare scrisă de la zero — rată de conversie mult mai mare decât o pagină unică.</span></li>
              <li className="flex gap-2"><span className="text-[#15803d] shrink-0">✔</span><span><strong>Mai multe upsell-uri 1-click, dintre care unul recurent</strong> — clientul cumpără cu un singur click, iar tu câștigi comision <strong>lunar, nelimitat</strong>, din același client.</span></li>
              <li className="flex gap-2"><span className="text-[#15803d] shrink-0">✔</span><span><strong>Site curat, profesionist și optimizat pentru mobil</strong> — de la click până la plată, fără frecare și fără pași inutili.</span></li>
              <li className="flex gap-2"><span className="text-[#15803d] shrink-0">✔</span><span><strong>Produs de calitate + suport dedicat</strong> — clienți mulțumiți și foarte puține rambursări, ceea ce înseamnă comisioane care rămân la tine.</span></li>
            </ul>
            <p className="bg-white border border-[#c9a44a]/30 rounded-xl p-3 text-[#1b2d4f]">
              Suntem dedicați succesului afiliaților noștri și abia așteptăm să lucrăm cu tine. Folosește linkurile de mai sus ca să începi.
            </p>
          </CardContent>
        </Card>

        {/* ============ 5. PRODUSELE SI PRETURILE ============ */}
        <Card>
          <CardHeader><CardTitle className="text-base text-[#1b2d4f] flex items-center gap-2"><DollarSign className="w-5 h-5 text-[#c9a44a]" /> Ce vinzi: produsele, prețurile și comisionul tău</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-[#64748b]"><strong className="text-[#1b2d4f]">Public țintă:</strong> bărbați și femei care vor să se împace cu fostul sau fosta.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f0f3f8] border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-[#64748b] font-medium">Produs</th>
                    <th className="px-4 py-3 text-left text-[#64748b] font-medium">Preț</th>
                    <th className="px-4 py-3 text-left text-[#64748b] font-medium">Ce este</th>
                    <th className="px-4 py-3 text-right text-[#64748b] font-medium">Comisionul tău</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#f0f3f8]">
                    <td className="px-4 py-3 font-semibold text-[#1b2d4f]">Produs principal — Cum să Oprești Durerea unei Despărțiri (PDF)</td>
                    <td className="px-4 py-3">67 lei</td>
                    <td className="px-4 py-3 text-[#64748b]">274 pagini (bărbați) / 207 pagini (femei), PDF</td>
                    <td className="px-4 py-3 text-right font-bold text-[#15803d]">33,50 lei</td>
                  </tr>
                  <tr className="border-b border-[#f0f3f8]">
                    <td className="px-4 py-3 font-semibold text-[#1b2d4f]">Bump #1 — Mesajele EXTRA de Împăcare</td>
                    <td className="px-4 py-3">19,95 lei</td>
                    <td className="px-4 py-3 text-[#64748b]">34 pagini, adăugat la checkout</td>
                    <td className="px-4 py-3 text-right font-bold text-[#15803d]">9,98 lei</td>
                  </tr>
                  <tr className="border-b border-[#f0f3f8]">
                    <td className="px-4 py-3 font-semibold text-[#1b2d4f]">Upsell #1 — Susținere Personală + Zero Despărțiri (PDF)</td>
                    <td className="px-4 py-3">97 lei<span className="text-[#64748b]">/lună</span></td>
                    <td className="px-4 py-3 text-[#64748b]">Programul cu Cristina (Zero Despărțiri, 149/118 pagini, e inclus gratuit). <strong className="text-[#166534]">Comisionul se plătește în fiecare lună, nelimitat.</strong></td>
                    <td className="px-4 py-3 text-right font-bold text-[#15803d]">48,50 lei<span className="text-[#64748b] font-normal">/lună</span></td>
                  </tr>
                  <tr className="border-b border-[#f0f3f8] bg-[#f8fafc]">
                    <td className="px-4 py-3 pl-10 italic text-[#64748b]">SAU — Susținere Personală cumpărate separat, pe pagina lor (fără Zero Despărțiri inclus)</td>
                    <td className="px-4 py-3">147 lei<span className="text-[#64748b]">/lună</span></td>
                    <td className="px-4 py-3 text-[#64748b]">Aceeași pagină de coaching, la prețul întreg, fără bonusul cu Zero Despărțiri</td>
                    <td className="px-4 py-3 text-right font-bold text-[#15803d]">73,50 lei<span className="text-[#64748b] font-normal">/lună</span></td>
                  </tr>
                  <tr className="border-b border-[#f0f3f8]">
                    <td className="px-4 py-3 font-semibold text-[#1b2d4f]">Downsell — Zero Despărțiri, preț redus</td>
                    <td className="px-4 py-3">39,95 / 19,95 lei</td>
                    <td className="px-4 py-3 text-[#64748b]">Se oferă dacă refuză upsell-ul (149 pagini bărbați / 118 femei)</td>
                    <td className="px-4 py-3 text-right font-bold text-[#15803d]">19,98 / 9,98 lei</td>
                  </tr>
                  <tr className="bg-[#f0fdf4] border-t-2 border-[#15803d]/30">
                    <td className="px-4 py-3 font-extrabold text-[#14532d]">TOTAL per client care cumpără tot</td>
                    <td className="px-4 py-3 text-[#166534]">—</td>
                    <td className="px-4 py-3 text-[#166534]">33,50 + 9,98 + 23,50 + <strong>73,50</strong> lei<br /><span className="text-xs">(coaching-ul socotit la prețul de 147 lei/lună, cel mai avantajos pentru tine)</span></td>
                    <td className="px-4 py-3 text-right text-lg font-extrabold text-[#15803d]">≈ 140,48 lei</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-[#94a3b8]">Comenzile sunt în lei, o singură plată (mai puțin abonamentul de coaching, care se reînnoiește lunar). Toate produsele sunt livrate digital, pe email, imediat după plată.</p>

            <div className="bg-[#f0fdf4] border-2 border-[#15803d]/40 rounded-xl p-4 space-y-2 text-sm">
              <p className="font-bold text-[#14532d]">Plus, peste totalul de mai sus:</p>
              <p className="text-[#166534]">+ <strong>48,50 lei sau 73,50 lei în fiecare lună, la nesfârșit</strong> — cât timp clientul rămâne abonat la Susținere Personală, comisionul se plătește lunar, fără limită. Un singur client bun te poate plăti luni întregi.</p>
              <p className="text-[#166534]">+ <strong>chiar dacă nu cumpără imediat, primești tot 50% din tot ce cumpără ulterior</strong> lead-urile pe care le-ai adus — din campaniile de emailuri <strong>și din conținutul nostru de pe social media</strong> — timp de <strong>60 de zile</strong> de la click.</p>
            </div>
          </CardContent>
        </Card>

        {/* ============ 6. ATRIBUIRE 60 DE ZILE (emailurile + contentul care vand pentru tine) ============ */}
        <Card className="border-[#15803d]/30 bg-[#f0fdf4]">
          <CardHeader><CardTitle className="text-base flex items-center gap-2 text-[#14532d]"><Mail className="w-5 h-5 text-[#15803d]" /> Lead-urile tale pot aduce bani chiar dacă nu au cumpărat din prima</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-[#166534] leading-relaxed">
            <p>
              Nu toată lumea cumpără din prima — și e normal. De aceea, fiecare persoană care intră prin linkul tău și își lasă adresa de email
              intră automat într-o <strong>campanie de emailuri special făcută să aducă vânzări</strong> — trimisă automat, în numele nostru,
              către lead-urile tale, cu povești, dovezi și oferte care le conduc spre carte. Și nu doar emailurile lucrează pentru tine:
              în paralel rulăm și <strong>campanii de conținut pe social media</strong> către exact aceiași oameni.
            </p>
            <p className="bg-white border-2 border-[#15803d]/40 rounded-xl p-3">
              <strong className="text-[#14532d]">Și primești 50% din toate plățile recurente pe care le aduc.</strong> Dacă un lead al tău intră
              în programul de <strong>Susținere Personală</strong>, comisionul tău se plătește <strong>în fiecare lună</strong>, cât timp rămâne
              abonat — fără să mai faci nimic în plus.
            </p>
            <p className="bg-white border border-[#15803d]/25 rounded-xl p-3">
              <strong className="text-[#14532d]">Ce înseamnă asta pentru tine:</strong> primești <strong>același comision de 50%</strong> pe
              <strong> fiecare vânzare</strong> făcută din emailurile pe care pestedespartire.ro le trimite automat. Chiar dacă omul cumpără peste
              2 zile sau peste 3 săptămâni, chiar dacă deschide emailul pe alt telefon sau în alt browser.
            </p>
            <p className="bg-white border-2 border-[#15803d]/40 rounded-xl p-3">
              <strong className="text-[#14532d]">Valează și pentru conținutul pe care îl publicăm noi, nu doar pentru emailuri.</strong> Promovăm
              constant ofertele pe <strong>TikTok, Instagram și Facebook</strong> — clipuri, povești, postări. Dacă un lead adus de tine vede acel
              conținut și <strong>cumpără mai târziu din cauza lui</strong>, comisionul de 50% este <strong>tot al tău</strong>. Tu ai promovat pagina
              pe social media, lead-ul ți-a fost atribuit, iar noi am continuat să-l încălzim pentru tine — deci ești plătit pentru el.
            </p>
            <p>
              Condiția e simplă: lead-ul <strong>să-și fi lăsat adresa de email</strong> (se întâmplă automat la testul de șanse și pe paginile
              de vânzare) și să cumpere <strong>de pe același email</strong> care ți-a fost atribuit ție. Atribuirea ține <strong>60 de zile</strong>
              de la click — în tot acest interval intri pe orice cumpără lead-ul tău, fie că vine din emailuri, fie din conținutul nostru de pe
              social media.
            </p>
            <p className="text-[#166534]/80">
              Practic: un singur click pe linkul tău te poate plăti luni întregi. Nu trebuie să faci nimic în plus — doar să aduci lead-ul.
            </p>
            <p className="bg-[#14532d] text-white rounded-xl p-4">
              <strong>Cel mai important lucru de înțeles:</strong> majoritatea banilor din acest program vin din <strong>emailuri</strong>, din
              <strong> conținutul de pe social media</strong> și din <strong>backend</strong> — adică din oamenii care revin și cumpără din nou,
              plus abonamentele recurente, nu din vânzarea de pe loc.
              De asta merită să aduci <strong>volum</strong> de lead-uri: chiar dacă 9 din 10 nu cumpără imediat, ei rămân în joc pentru tine 60 de zile,
              iar cei care cumpără mai târziu aduc adesea mai mult decât cei care cumpără pe loc.
            </p>
          </CardContent>
        </Card>

        {/* ============ 7. CUM PRIMESTI BANII ============ */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2 text-[#1b2d4f]"><Wallet className="w-4 h-4 text-[#1b2d4f]" /> Cum primești banii</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-[#64748b]">
            <div className={"rounded-xl p-4 border-2 " + (isStripe ? "bg-[#eef2ff] border-[#1b2d4f]/30" : "bg-[#fdf6e3] border-[#c9a44a]/50")}>
              <p className="text-[#1b2d4f] text-sm font-bold flex items-center gap-2 flex-wrap">
                <Wallet className="w-4 h-4" />
                Metoda ta de plată acum: {isStripe ? "automat prin Stripe" : "transfer bancar (IBAN)"}
                <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full text-white " + (isStripe ? "bg-[#1b2d4f]" : "bg-[#8a6a12]")}>ACTIVĂ</span>
              </p>
              <p className="text-xs mt-1">Folosești o singură metodă odată. Butonul din cardul „Banii tăi" și felul în care îți intră banii se schimbă în funcție de ce alegi aici — le poți schimba oricând.</p>
            </div>

            <details className="group bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3" open={isStripe}>
              <summary className="cursor-pointer font-bold text-[#1b2d4f] text-sm">Opțiunea A — automat prin Stripe Connect (recomandat){isStripe && <span className="ml-2 align-middle text-[10px] font-bold bg-[#15803d] text-white px-2 py-0.5 rounded-full">✓ METODA TA ACUM</span>}</summary>
              <div className="mt-2 space-y-2 leading-relaxed text-[#64748b]">
                <p>Îți faci contul <strong>o singură dată</strong>, completezi datele și contul bancar, și gata — banii se trimit singuri, fără să ceri tu nimic.</p>
                <p><strong className="text-[#1b2d4f]">Cum funcționează:</strong> comisioanele tale stau în siguranță la noi până devin scadente. Până atunci apar ca „În așteptare" — <strong>e normal ca în contul Stripe să fie 0</strong> în această perioadă, banii nu au plecat încă de la noi.</p>
                <p>După scadență suma trece la <strong className="text-[#1b2d4f]">„Disponibil de retras"</strong>. De acolo <strong>se trimite singură</strong>: când ai <strong>{MIN_AUTO_STRIPE_LEI} lei scadenți</strong>, transferul pleacă automat, fără să apeși nimic. Dacă vrei mai repede, apeși <strong>„Retrage acum"</strong> din cardul „Banii tăi" și retragi orice sumă, fără prag minim.</p>
                <p>Primești email de la noi când suma intră în contul tău Stripe, iar Stripe îți trimite email când banii pleacă spre contul tău bancar (1–2 zile lucrătoare).</p>
                {connectStatus === "active" ? (
                  isStripe ? (
                    <p className="text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">✅ Contul tău Stripe e conectat și este metoda ta de plată.</p>
                  ) : (
                    <button
                      onClick={() => saveMethod("stripe")}
                      disabled={savingMethod}
                      className="bg-[#1b2d4f] hover:bg-[#2d4a7a] text-white text-sm font-bold px-6 py-2 rounded-full disabled:opacity-60"
                    >
                      {savingMethod ? "Se salvează..." : "Folosește Stripe pentru plăți"}
                    </button>
                  )
                ) : (
                  <div>
                    <button
                      onClick={startConnect}
                      disabled={connecting}
                      className="bg-[#1b2d4f] hover:bg-[#2d4a7a] text-white text-sm font-bold px-6 py-2 rounded-full disabled:opacity-60"
                    >
                      {connecting ? "Se pregătește..." : connectStatus === "restricted" ? "Reconectează contul Stripe" : connectStatus === "pending" ? "Continuă onboarding-ul Stripe" : "Conectează contul Stripe (automat)"}
                    </button>
                  </div>
                )}
              </div>
            </details>

            <details className="group bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3" open={!isStripe}>
              <summary className="cursor-pointer font-bold text-[#1b2d4f] text-sm">Opțiunea B — manual, prin transfer bancar (IBAN){!isStripe && <span className="ml-2 align-middle text-[10px] font-bold bg-[#15803d] text-white px-2 py-0.5 rounded-full">✓ METODA TA ACUM</span>}</summary>
              <div className="mt-2 leading-relaxed text-[#64748b] space-y-3">
                <p>Scrii IBAN-ul tău unde vrei să-ți trimit banii aici (recomand IBAN pentru un cont de Revolut, Raiffeisen, dar și orice altă bancă funcționează). Când ai minim <strong>{MIN_MANUAL_LEI} lei</strong> scadenți apeși „Solicită plata" și îți fac transferul personal în 1–3 zile lucrătoare, iar tu primești un email când ți-am trimis banii.</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={payoutDetails}
                    onChange={(e) => setPayoutDetails(e.target.value)}
                    placeholder="IBAN (ex. RO49 AAAA 1B31 0075 9384 0000)"
                    className="flex-1 min-w-[200px] border border-[#cbd5e1] rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-[#1b2d4f]"
                  />
                  <button
                    onClick={() => saveMethod("iban")}
                    disabled={savingMethod}
                    className="bg-[#1b2d4f] hover:bg-[#2d4a7a] text-white text-sm font-bold px-6 py-2 rounded-full disabled:opacity-60"
                  >
                    {savingMethod ? "Se salvează..." : isStripe ? "Salvează IBAN și folosește transferul bancar" : "Salvează IBAN"}
                  </button>
                </div>
                <p className="text-xs text-[#94a3b8]">Verifică atent IBAN-ul — pe el se face plata. Poți schimba metoda oricând; comisioanele deja plătite rămân plătite.</p>
              </div>
            </details>
          </CardContent>
        </Card>

        {/* ============ 8. LINK-URI DE AFILIERE ============ */}
        <Card className="border-[#c9a44a]/20 bg-[#f8f5ec]">
          <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2 text-[#1b2d4f]"><Link2 className="w-4 h-4 text-[#c9a44a]" /> Link-urile tale de afiliere</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-[#64748b]">Alege linkul potrivit pentru fiecare postare: testul de șanse merge pentru audiență generală, iar paginile de bărbați/femei pentru conținut direcționat. Codul tău se adaugă automat la final (?ref=...).</p>
            {links.map((lk) => (
              <div key={lk.key} className="bg-white border border-[#e8d9a0] rounded-xl p-4">
                <p className="font-bold text-[#1b2d4f] text-sm">{lk.label}</p>
                <p className="text-xs text-[#64748b] mt-0.5 mb-2">{lk.desc}</p>
                <div className="flex gap-2 flex-wrap">
                  <Input value={lk.href} readOnly className="font-mono text-sm bg-[#f8fafc] flex-1 min-w-[220px]" />
                  <Button onClick={() => copyLink(lk.href, lk.label)} variant="outline" className="border-[#c9a44a] text-[#c9a44a] hover:bg-[#c9a44a] hover:text-white"><Copy className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ============ 9. GHID + FAQ ============ */}
        <Card>
          <CardHeader><CardTitle className="text-base text-[#1b2d4f] flex items-center gap-2"><HelpCircle className="w-5 h-5 text-[#c9a44a]" /> Cum promovezi — ghid practic + FAQ</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-[#334155]">
            <details className="group bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4">
              <summary className="cursor-pointer font-bold text-[#1b2d4f]">1. Ce conținut să faci (recomandat)</summary>
              <div className="mt-2 space-y-2 text-[#64748b] leading-relaxed">
                <p>Cel mai bine convertesc conținuturile care oglindesc <strong>pagina de vânzări</strong>: problema (despărțirea, durerea), soluția (metoda psihologică din carte), dovada (poveștile de împăcare). Idei concrete:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>TikTok / Reels / Shorts:</strong> povestește pe scurt o situație de despărțire și cum s-a rezolvat cu psihologia („hormonul iubirii"), apoi „am lăsat linkul cu tot ce am folosit în bio".</li>
                  <li><strong>Story-uri:</strong> pune testul în sticker/link și scrie un text propriu, cu vocea ta.</li>
                  <li><strong>Postări + DM:</strong> când cineva își povestește despărțirea (online sau în viața reală), scrie-i în privat — nu ca reclamă, ci ca ajutor.</li>
                  <li><strong>YouTube / blog:</strong> recenzii sincere ale cărții sau „ce am învățat despre psihologia împăcării”, linkul în descriere.</li>
                  <li><strong>Bio:</strong> pune linkul în bio pe TikTok/Instagram/Facebook și amintește-l în fiecare video.</li>
                </ul>
              </div>
            </details>
            <details className="group bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4">
              <summary className="cursor-pointer font-bold text-[#1b2d4f]">2. Câștig bani și din lead-urile care nu cumpără imediat?</summary>
              <div className="mt-2 space-y-2 text-[#64748b] leading-relaxed">
                <p className="bg-[#f0fdf4] border border-green-200 rounded-lg p-3 text-[#166534]">Da. E explicat pe larg în cardul verde de mai sus, <strong>„Lead-urile tale pot aduce bani chiar dacă nu au cumpărat din prima"</strong> — ca să nu repetăm aceleași lucruri aici, pe scurt: lead-ul intră într-o <strong>secvență automată de 30+ emailuri</strong> trimise pe parcursul a <strong>30 de zile</strong>, atribuirea ține <strong>60 de zile</strong> de la click, iar tu iei <strong>50%</strong> din fiecare vânzare care vine din acele emailuri <strong>sau din conținutul nostru de pe social media</strong>.</p>
              </div>
            </details>
            <details className="group bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4">
              <summary className="cursor-pointer font-bold text-[#1b2d4f]">3. Cât de repede primești banii și care e minimul?</summary>
              <div className="mt-2 space-y-2 text-[#64748b] leading-relaxed">
                <p><strong className="text-[#1b2d4f]">Când devin banii scadenți:</strong> comisionul devine plătibil la <strong>31 de zile</strong> de la achiziție (după garanția de 30 de zile). Până atunci apare ca „În așteptare" în „Comisioanele Tale", cu data exactă la „Platibil la".</p>
                <p><strong className="text-[#1b2d4f]">Cât e minimul:</strong> la <strong>Stripe</strong> transferul pleacă <strong>automat la {MIN_AUTO_STRIPE_LEI} lei</strong> scadenți — nu apeși nimic. Dacă vrei mai repede, butonul „Retrage acum" merge fără prag, pentru orice sumă. La <strong>transfer bancar (IBAN)</strong> ai nevoie de minim <strong>{MIN_MANUAL_LEI} lei</strong> scadenți, ca să merite transferul.</p>
                <p><strong className="text-[#1b2d4f]">Ce se întâmplă după ce ceri banii:</strong> la Stripe, suma intră imediat în contul tău Stripe și apoi în bancă în 1–2 zile lucrătoare. La IBAN, primesc eu cererea pe email, fac transferul personal în 1–3 zile lucrătoare, iar tu primești un email când ți-am trimis banii.</p>
                <p><strong className="text-[#1b2d4f]">Cum știu că mi s-au trimis banii?</strong> Statusul fiecărui comision se schimbă în tabelul „Comisioanele Tale": <strong>În așteptare</strong> → <strong>Aprobat</strong> (a intrat în următoarea plată) → <strong>Plătit</strong> (banii au plecat). Primești și email automat. Dacă folosești Stripe Connect, poți verifica oricând suma și plățile în <strong>dashboard-ul tău Express</strong> — intri în el cu butonul din cardul „Banii tăi".</p>
              </div>
            </details>
            <details className="group bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4">
              <summary className="cursor-pointer font-bold text-[#1b2d4f]">4. Reguli simple (ca să nu-ți pierzi contul)</summary>
              <div className="mt-2 space-y-2 text-[#64748b] leading-relaxed">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Fii sincer: recomandă produsele ca recomandare personală și menționează că ai un link de afiliat unde e cazul.</li>
                  <li>Nu promite rezultate garantate și nu folosi afirmații false despre câștiguri sau vindecări.</li>
                  <li>Nu face spam în comentarii/grupuri — postează doar unde e relevant și permis.</li>
                  <li>O rambursare a clientului anulează comisionul aferent (garanția de 30 de zile).</li>
                </ul>
              </div>
            </details>
          </CardContent>
        </Card>

        {/* ============ 10. TESTIMONIALE AFILIATI ============ */}
        <Card>
          <CardHeader><CardTitle className="text-base text-[#1b2d4f] flex items-center gap-2"><Star className="w-5 h-5 text-[#c9a44a]" /> Ce spun alți afiliați <span className="text-[11px] font-normal text-[#94a3b8]">(exemple ilustrative — înlocuiește-le cu mărturiile tale reale)</span></CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="bg-[#f8f5ec] border border-[#e8d9a0] rounded-xl p-4"><p className="text-[#334155] italic text-sm">„Am pus linkul cu testul în bio pe TikTok și am postat de 2–3 ori pe săptămână despre împăcare. În prima lună am avut 4 vânzări."</p><p className="text-xs font-bold text-[#1b2d4f] mt-2">— Maria, 29 ani</p></div>
            <div className="bg-[#f8f5ec] border border-[#e8d9a0] rounded-xl p-4"><p className="text-[#334155] italic text-sm">„Recomand testul în grupuri de relații, doar unde se potrivește discuția. În 3 luni am strâns peste 15.000 lei din comisioane, fără să mă simt că fac reclamă sau efort prea mult. Site-ul e făcut să convertească bine."</p><p className="text-xs font-bold text-[#1b2d4f] mt-2">— Andrei, 34 ani</p></div>
            <div className="bg-[#f8f5ec] border border-[#e8d9a0] rounded-xl p-4"><p className="text-[#334155] italic text-sm">„Cel mai bine a mers când i-am îndemnat pe urmăritorii mei să-mi împărtășească anonim povestea despărțirii lor, iar apoi am pus un story cu link-ul de afiliat."</p><p className="text-xs font-bold text-[#1b2d4f] mt-2">— Elena, 31 ani</p></div>
            <div className="bg-[#f8f5ec] border border-[#e8d9a0] rounded-xl p-4"><p className="text-[#334155] italic text-sm">„Am făcut un video scurt cu părerea mea sinceră despre carte + linkul în bio. Am avut 12 vânzări într-o lună. Contează mult să spui o poveste reală, nu să citești un text de prezentare."</p><p className="text-xs font-bold text-[#1b2d4f] mt-2">— Cristi, 27 ani</p></div>
            <div className="bg-[#f8f5ec] border-2 border-[#c9a44a]/50 rounded-xl p-4 md:col-span-2"><p className="text-[#334155] italic text-sm">„Ofertele Peste Despărțire sunt printre cele mai convertibile din nișă, iar conținutul e de calitate foarte bună. Comunicarea e excelentă și sunt foarte deschiși să te ajute să vinzi mai bine ca afiliat. Recomand cu toată încrederea!"</p><p className="text-xs font-bold text-[#1b2d4f] mt-2">— Andrei M., afiliat</p></div>
          </CardContent>
        </Card>

        {/* ============ 11. CE ZICE LUMEA DESPRE BIBLIA IMPACARII ============ */}
        <Card>
          <CardHeader><CardTitle className="text-base text-[#1b2d4f] flex items-center gap-2"><Star className="w-5 h-5 text-[#c9a44a]" /> Ce zice lumea despre Cum să Oprești Durerea unei Despărțiri</CardTitle></CardHeader>
          <CardContent>
            <div className="bg-[#f8f5ec] border border-[#e8d9a0] rounded-xl p-4">
              <p className="text-[#334155] italic text-sm leading-relaxed">
                Cum să Oprești Durerea unei Despărțiri este cea mai completă carte scrisă vreodată pe acest subiect. Nu lasă nimic nediscutat. Ai impresia că situația
                ta este unică și că nicio carte nu poate acoperi ce treci tu, însă cu Cum să Oprești Durerea unei Despărțiri nu este cazul. Cristina a acoperit fiecare
                scenariu posibil și fiecare situație de tipul ce s-ar întâmpla dacă, așa că atunci când termini cartea, aproape sigur ți-ai găsit
                răspunsurile. Cel mai important lucru este că se vede că metodele au fost testate pe cupluri reale. Se simte experiența în fiecare
                capitol. Are zeci de idei pe care nu le-am citit nicăieri altundeva. Capitolul despre mesaje, de exemplu, are zeci de texte gata
                scrise pe care le poți trimite fostului și care aproape sigur primesc un răspuns. Este singurul ghid pe care l-am găsit care chiar
                îți arată, cu exemple, cum să aplici ce scrie. După ce am comparat alte produse similare de pe internet, rămâne prima alegere
                dacă vrei un manual pas cu pas.
              </p>
              <p className="text-xs font-bold text-[#1b2d4f] mt-2">Client X ani</p>
            </div>
          </CardContent>
        </Card>

        {/* ============ 12. ALTE OFERTE PE CARE LE POTI PROMOVA ============ */}
        <Card className="border-[#c9a44a]/25 bg-[#f8f5ec]">
          <CardHeader><CardTitle className="text-base text-[#1b2d4f] flex items-center gap-2"><Star className="w-5 h-5 text-[#c9a44a]" /> Alte oferte pe care le poți promova</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs text-[#64748b] mb-4">Aceleași reguli și același comision, doar domeniul diferă. Apasă pe imagine ca să intri în programul de afiliere al ofertei.</p>
            <div className="grid gap-5 sm:grid-cols-2 max-w-4xl">
              {ALTE_OFERTE.map((o, i) => (
                o ? (
                  <a key={i} href={o.href} target="_blank" rel="noopener noreferrer" className="block group">
                    <img
                      src={o.img}
                      alt={o.title + " — program de afiliere"}
                      loading="lazy"
                      className="w-full rounded-xl border border-[#e8d9a0] shadow-sm group-hover:shadow-md group-hover:border-[#c9a44a] transition-all"
                    />
                    <p className="text-sm font-bold text-[#1b2d4f] mt-2 group-hover:text-[#c9a44a]">{o.title} →</p>
                    <p className="text-xs text-[#64748b]">{o.desc}</p>
                  </a>
                ) : (
                  <div key={i} className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#e0d5b0] bg-white/40 min-h-[190px] p-6 text-center">
                    <p className="text-lg font-extrabold tracking-[0.25em] text-[#b3a06a]">UPCOMING</p>
                  </div>
                )
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ============ 13. TERMENI SI CONDITII AFILIATI ============ */}
        <Card className="border-[#dde3ef] bg-white">
          <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2 text-[#1b2d4f]"><HelpCircle className="w-4 h-4 text-[#1b2d4f]" /> Termeni și condiții pentru afiliați</CardTitle></CardHeader>
          <CardContent className="text-sm text-[#64748b]">
            <p>
              Înainte să promovezi, citește{" "}
              <a href="/affiliate/termeni" className="text-blue-600 underline font-semibold">regulile simple pe care trebuie să le respecți ca afiliat</a>.
              Sunt scurte și clare — te protejează pe tine și pe clienții tăi.
            </p>
          </CardContent>
        </Card>

        {/* ============ 14. CONTACT ============ */}
        <Card className="border-[#dde3ef] bg-white">
          <CardContent className="p-5 text-sm text-[#64748b] flex items-start gap-2">
            <Mail className="w-4 h-4 mt-0.5 text-[#c9a44a] shrink-0" />
            <p>Pentru probleme sau alte informații și întrebări, scrie-mi la <a href="mailto:anca@pestedespartire.ro" className="text-blue-600 underline font-semibold">anca@pestedespartire.ro</a>.</p>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
