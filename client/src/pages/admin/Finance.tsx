import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Wallet, TrendingUp, TrendingDown, Users, PiggyBank, Plus, Trash2, Copy, Percent } from "lucide-react";
import { toast } from "sonner";

/** Toate sumele vin in lei din server; aici doar le formatam pentru afisare. */
function ron(n: number | null | undefined): string {
  return (Math.round((n || 0) * 100) / 100).toFixed(2).replace(".", ",") + " RON";
}

function azi(): string {
  return new Date().toISOString().slice(0, 10);
}

type Preset = "luna" | "lunaTrecuta" | "an" | "tot" | "custom";

/** Transforma preselectia in interval de date (siruri YYYY-MM-DD). */
function interval(preset: Preset, fromCustom: string, toCustom: string): { from?: string; to?: string } {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  if (preset === "luna") return { from: iso(new Date(Date.UTC(y, m, 1))), to: iso(new Date(Date.UTC(y, m + 1, 0))) };
  if (preset === "lunaTrecuta") return { from: iso(new Date(Date.UTC(y, m - 1, 1))), to: iso(new Date(Date.UTC(y, m, 0))) };
  if (preset === "an") return { from: y + "-01-01", to: y + "-12-31" };
  if (preset === "custom") return { from: fromCustom || undefined, to: toCustom || undefined };
  return {};
}

const NUME_LUNA: Record<string, string> = {
  "01": "ianuarie", "02": "februarie", "03": "martie", "04": "aprilie", "05": "mai", "06": "iunie",
  "07": "iulie", "08": "august", "09": "septembrie", "10": "octombrie", "11": "noiembrie", "12": "decembrie",
};

function lunaLizibila(luna: string): string {
  const [y, m] = luna.split("-");
  return (NUME_LUNA[m] || m) + " " + y;
}

export default function AdminFinance() {
  const [preset, setPreset] = useState<Preset>("an");
  const [fromCustom, setFromCustom] = useState("");
  const [toCustom, setToCustom] = useState("");
  const range = interval(preset, fromCustom, toCustom);

  const { data: overview } = trpc.finance.overview.useQuery(range);
  const { data: surse } = trpc.finance.bySource.useQuery(range);
  const { data: luni } = trpc.finance.byMonth.useQuery({ months: 12 });
  const { data: datorii } = trpc.finance.affiliateLiabilities.useQuery();
  const { data: listeCheltuieli, refetch: refetchCheltuieli } = trpc.finance.expenses.list.useQuery({ limit: 200 });
  const { data: peCategorii } = trpc.finance.expenses.byCategory.useQuery(range);
  const { data: categorii } = trpc.finance.expenses.categories.useQuery();

  const adauga = trpc.finance.expenses.add.useMutation();
  const sterge = trpc.finance.expenses.remove.useMutation();

  const [spentAt, setSpentAt] = useState(azi());
  const [category, setCategory] = useState("ads");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [recurring, setRecurring] = useState(false);

  const trimite = async () => {
    const suma = parseFloat(amount.replace(",", "."));
    if (!description.trim() || !(suma > 0)) {
      toast.error("Completează descrierea și o sumă mai mare decât 0.");
      return;
    }
    try {
      await adauga.mutateAsync({
        spentAt,
        category: category as never,
        description: description.trim(),
        amount: suma,
        recurring,
      });
      toast.success("Cheltuială adăugată.");
      setDescription(""); setAmount(""); setRecurring(false);
      refetchCheltuieli();
    } catch (err: any) {
      toast.error(err?.message || "Nu am putut salva cheltuiala.");
    }
  };

  const stergeCheltuiala = async (id: number) => {
    try {
      await sterge.mutateAsync({ id });
      toast.success("Cheltuială ștearsă.");
      refetchCheltuieli();
    } catch (err: any) {
      toast.error(err?.message || "Nu am putut șterge.");
    }
  };

  const copiaza = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success("Copiat: " + text)).catch(() => toast.error("Nu am putut copia."));
  };

  const profitPozitiv = (overview?.profit || 0) >= 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Finanțe</h1>
            <p className="text-muted-foreground text-sm mt-1">Încasări, comisioane, cheltuieli și profit — totul într-un singur loc.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as Preset)}
              className="border rounded-md px-3 py-2 text-sm bg-white"
            >
              <option value="luna">Luna asta</option>
              <option value="lunaTrecuta">Luna trecută</option>
              <option value="an">Anul acesta</option>
              <option value="tot">Tot (de la început)</option>
              <option value="custom">Interval ales</option>
            </select>
            {preset === "custom" && (
              <>
                <Input type="date" value={fromCustom} onChange={(e) => setFromCustom(e.target.value)} className="w-auto" />
                <span className="text-sm text-muted-foreground">până la</span>
                <Input type="date" value={toCustom} onChange={(e) => setToCustom(e.target.value)} className="w-auto" />
              </>
            )}
          </div>
        </div>

        {/* ===== Situatia pe scurt ===== */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card><CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><TrendingUp className="w-4 h-4" /> Încasat</div>
            <p className="text-2xl font-bold mt-1">{ron(overview?.incasat)}</p>
            <p className="text-xs text-muted-foreground mt-1">{overview?.comenzi || 0} comenzi · medie {ron(overview?.comandaMedie)}</p>
          </CardContent></Card>

          <Card><CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><TrendingDown className="w-4 h-4" /> Rambursări</div>
            <p className="text-2xl font-bold mt-1">{ron(overview?.rambursat)}</p>
            <p className="text-xs text-muted-foreground mt-1">venit net: {ron(overview?.venitNet)}</p>
          </CardContent></Card>

          <Card><CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><Users className="w-4 h-4" /> Comision afiliați</div>
            <p className="text-2xl font-bold mt-1">{ron(overview?.comisionTotal)}</p>
            <p className="text-xs text-muted-foreground mt-1">din vânzările din perioadă</p>
          </CardContent></Card>

          <Card><CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><Wallet className="w-4 h-4" /> Cheltuieli</div>
            <p className="text-2xl font-bold mt-1">{ron(overview?.cheltuieli)}</p>
            <p className="text-xs text-muted-foreground mt-1">adăugate manual, mai jos</p>
          </CardContent></Card>
        </div>

        <Card className={profitPozitiv ? "border-green-300 bg-green-50/50" : "border-red-300 bg-red-50/50"}>
          <CardContent className="p-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <PiggyBank className={"w-8 h-8 " + (profitPozitiv ? "text-green-600" : "text-red-600")} />
              <div>
                <p className="text-sm text-muted-foreground">Profit (venit net − comisioane − cheltuieli)</p>
                <p className={"text-3xl font-extrabold " + (profitPozitiv ? "text-green-700" : "text-red-700")}>{ron(overview?.profit)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Percent className="w-4 h-4 text-muted-foreground" />
              Marjă: <strong>{overview?.marja ?? 0}%</strong> din venitul net
            </div>
          </CardContent>
        </Card>

        {/* ===== Cât trebuie trimis afiliaților ===== */}
        <Card className="border-[#1b2d4f]/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5" /> Cât trebuie trimis afiliaților
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-[#eef2ff] border-2 border-[#1b2d4f]/25 rounded-xl p-4">
                <p className="text-xs font-bold">Scadent acum (poți plăti)</p>
                <p className="text-2xl font-extrabold">{ron(datorii?.totaluri.scadent)}</p>
              </div>
              <div className="bg-muted/40 border rounded-xl p-4">
                <p className="text-xs text-muted-foreground">În așteptare (până la 31 de zile)</p>
                <p className="text-2xl font-bold">{ron(datorii?.totaluri.inAsteptare)}</p>
              </div>
              <div className="bg-muted/40 border rounded-xl p-4">
                <p className="text-xs text-muted-foreground">Plătit până acum</p>
                <p className="text-2xl font-bold text-green-700">{ron(datorii?.totaluri.platit)}</p>
              </div>
              <div className="bg-[#f8f5ec] border border-[#e8d9a0] rounded-xl p-4">
                <p className="text-xs font-bold">Total comisioane generate</p>
                <p className="text-2xl font-extrabold">{ron(datorii?.totaluri.total)}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">mai ai de trimis: {ron(datorii?.totaluri.dePlatit)}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Afiliat</TableHead>
                    <TableHead>Metodă</TableHead>
                    <TableHead>IBAN / cont</TableHead>
                    <TableHead className="text-right">Scadent acum</TableHead>
                    <TableHead className="text-right">În așteptare</TableHead>
                    <TableHead className="text-right">Plătit</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(datorii?.lista || []).length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">Nu există afiliați încă.</TableCell></TableRow>
                  ) : (
                    (datorii?.lista || []).map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <p className="font-medium">{a.name}</p>
                          <p className="text-xs text-muted-foreground">{a.email}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {a.payoutMethod === "stripe" ? "Stripe (automat)" : a.payoutMethod === "iban" ? "IBAN" : a.payoutMethod || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {a.payoutDetails ? (
                            <button onClick={() => copiaza(a.payoutDetails as string)} className="font-mono text-xs inline-flex items-center gap-1 hover:underline">
                              <Copy className="w-3 h-3" /> {a.payoutDetails}
                            </button>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </TableCell>
                        <TableCell className="text-right font-bold">{ron(a.scadent)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{ron(a.inAsteptare)}</TableCell>
                        <TableCell className="text-right text-green-700">{ron(a.platit)}</TableCell>
                        <TableCell className="text-right">{ron(a.total)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground">
              Ca să marchezi o plată ca făcută (și să primească afiliatul emailul), mergi la <a href="/admin/affiliates" className="text-blue-600 underline">Afiliați</a> →
              „Marchează plătit”. Suma scadentă se calculează din comisioanele care au trecut de 31 de zile.
            </p>
          </CardContent>
        </Card>

        {/* ===== De unde vin banii ===== */}
        <Card>
          <CardHeader><CardTitle className="text-base">De unde vin banii</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {(surse?.surse || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nu există vânzări în perioada aleasă.</p>
            ) : (
              <>
                {surse!.surse.map((s) => (
                  <div key={s.sursa} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{s.eticheta}</span>
                      <span>{ron(s.suma)} · {s.procent}% · {s.comenzi} comenzi</span>
                    </div>
                    <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-[#1b2d4f]" style={{ width: Math.max(2, s.procent) + "%" }} />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  „Emailuri" = clientul a dat click pe un email trimis de site în cele 7 zile dinaintea comenzii.
                  „Direct / social media / organic" = restul (a ajuns pe site fără email și fără link de afiliat).
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* ===== Pe luni ===== */}
        <Card>
          <CardHeader><CardTitle className="text-base">Ultimele 12 luni</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Luna</TableHead>
                    <TableHead className="text-right">Comenzi</TableHead>
                    <TableHead className="text-right">Încasat</TableHead>
                    <TableHead className="text-right">Rambursări</TableHead>
                    <TableHead className="text-right">Comision afiliați</TableHead>
                    <TableHead className="text-right">Cheltuieli</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(luni || []).map((l) => (
                    <TableRow key={l.luna} className={l.profit < 0 ? "bg-red-50/50" : ""}>
                      <TableCell className="font-medium">{lunaLizibila(l.luna)}</TableCell>
                      <TableCell className="text-right">{l.comenzi}</TableCell>
                      <TableCell className="text-right">{ron(l.incasat)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{ron(l.rambursat)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{ron(l.comision)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{ron(l.cheltuieli)}</TableCell>
                      <TableCell className={"text-right font-bold " + (l.profit < 0 ? "text-red-700" : "text-green-700")}>{ron(l.profit)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* ===== Cheltuieli ===== */}
        <Card>
          <CardHeader><CardTitle className="text-base">Cheltuieli</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 items-end bg-muted/40 border rounded-xl p-4">
              <div>
                <label className="text-xs text-muted-foreground">Data</label>
                <Input type="date" value={spentAt} onChange={(e) => setSpentAt(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Categorie</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-white h-10">
                  {(categorii || []).map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="lg:col-span-2">
                <label className="text-xs text-muted-foreground">Descriere</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ex. Reclame Facebook – septembrie" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Sumă (lei)</label>
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="ex. 250" inputMode="decimal" />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                  <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
                  Lunar
                </label>
                <Button onClick={trimite} disabled={adauga.isPending} className="whitespace-nowrap">
                  <Plus className="w-4 h-4 mr-1" /> Adaugă
                </Button>
              </div>
            </div>

            {(peCategorii || []).length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {peCategorii!.map((c) => (
                  <div key={c.category} className="border rounded-xl p-3">
                    <p className="text-xs text-muted-foreground">{c.categoryLabel}</p>
                    <p className="text-lg font-bold">{ron(c.total)}</p>
                    <p className="text-[11px] text-muted-foreground">{c.nr} înregistrări (în perioada aleasă)</p>
                  </div>
                ))}
              </div>
            )}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Categorie</TableHead>
                    <TableHead>Descriere</TableHead>
                    <TableHead className="text-right">Sumă</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(listeCheltuieli || []).length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Nicio cheltuială înregistrată încă.</TableCell></TableRow>
                  ) : (
                    (listeCheltuieli || []).map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{new Date(c.spentAt).toLocaleDateString("ro-RO")}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{c.categoryLabel}</Badge>
                          {c.recurring && <Badge className="ml-1 bg-blue-100 text-blue-800">lunar</Badge>}
                        </TableCell>
                        <TableCell>{c.description}</TableCell>
                        <TableCell className="text-right font-medium">{ron(c.amount)}</TableCell>
                        <TableCell>
                          <button onClick={() => stergeCheltuiala(c.id)} className="text-red-600 hover:text-red-800" title="Șterge">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
