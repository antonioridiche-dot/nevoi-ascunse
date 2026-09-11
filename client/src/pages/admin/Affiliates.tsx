import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { UserPlus, Copy, Check } from "lucide-react";
import { toast } from "sonner";

/** Etichete lizibile pentru metoda de plata aleasa de afiliat. */
const METHOD_LABELS: Record<string, string> = {
  stripe: "Stripe (automat)",
  iban: "Transfer bancar (IBAN)",
  paypal: "PayPal",
  wise: "Wise",
  revolut: "Revolut",
};

function ron(cents: number | null | undefined): string {
  return ((cents || 0) / 100).toFixed(2).replace(".", ",") + " RON";
}

export default function AdminAffiliates() {
  const { data: affiliates, isLoading, refetch } = trpc.affiliates.listAll.useQuery();
  const markPaid = trpc.affiliates.markPaid.useMutation();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const totalPaid = affiliates?.reduce((sum: number, a: any) => sum + (a.totalPaid || 0), 0) || 0;
  const totalDue = affiliates?.reduce((sum: number, a: any) => sum + (a.dueCents || 0), 0) || 0;

  const copyIban = (value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(value);
      toast.success("Copiat: " + value);
      setTimeout(() => setCopied(null), 2000);
    }).catch(() => toast.error("Nu am putut copia. Selectează manual."));
  };

  const doMarkPaid = async (aff: any) => {
    try {
      const res = await markPaid.mutateAsync({ affiliateId: aff.id });
      toast.success("Marcat plătit: " + ron(res.amount * 100) + " (" + res.count + " comisioane) pentru " + aff.name + ".");
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || "Nu am putut marca plata.");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Afiliați</h1>
            <p className="text-muted-foreground text-sm mt-1">Gestionează programul de afiliere</p>
          </div>
          <Button onClick={() => setShowInvite(true)}>
            <UserPlus className="h-4 w-4 mr-2" /> Invită Afiliat
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Afiliați</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{affiliates?.length || 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Activi</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{affiliates?.filter((a: any) => a.status === "active").length || 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">De plată acum (scadent)</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-amber-600">{ron(totalDue)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Plătit</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600">{ron(totalPaid)}</div></CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Se încarcă...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nume</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Cod</TableHead>
                      <TableHead>Comision</TableHead>
                      <TableHead>Metodă de plată</TableHead>
                      <TableHead>IBAN / cont</TableHead>
                      <TableHead>De plată acum</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {affiliates && affiliates.length > 0 ? affiliates.map((aff: any) => (
                      <TableRow key={aff.id}>
                        <TableCell className="font-medium text-sm">{aff.name}</TableCell>
                        <TableCell className="text-sm">{aff.email}</TableCell>
                        <TableCell><Badge variant="outline" className="font-mono text-xs">{aff.referralCode}</Badge></TableCell>
                        <TableCell className="text-sm">{aff.commissionPercent}%</TableCell>
                        <TableCell className="text-sm">
                          {aff.payoutMethod ? (
                            <>
                              {METHOD_LABELS[aff.payoutMethod] || aff.payoutMethod}
                              {aff.connectStatus === "active" && aff.payoutMethod === "stripe" && (
                                <span className="block text-[11px] text-green-700">conectat ✓</span>
                              )}
                              {aff.payoutMethod === "stripe" && aff.connectStatus !== "active" && (
                                <span className="block text-[11px] text-amber-600">neconectat încă</span>
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground text-xs">nesetată</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {aff.payoutDetails ? (
                            <button
                              onClick={() => copyIban(aff.payoutDetails)}
                              title="Copiază"
                              className="font-mono text-xs inline-flex items-center gap-1 hover:text-[#1b2d4f] underline decoration-dotted"
                            >
                              {aff.payoutDetails}
                              {copied === aff.payoutDetails ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                            </button>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {aff.dueCents > 0 ? (
                            <span className="font-semibold text-amber-700">{ron(aff.dueCents)} <span className="font-normal text-xs text-muted-foreground">({aff.dueCount})</span></span>
                          ) : (
                            <span className="text-muted-foreground text-xs">nimic scadent</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={aff.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {aff.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!aff.dueCents || markPaid.isPending}
                            onClick={() => doMarkPaid(aff)}
                            title="Apasă DUPĂ ce ai făcut transferul bancar"
                          >
                            Marchează plătit
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nu există afiliați</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          Fluxul manual: afiliatul apasă „Solicită plata” → primești email cu IBAN-ul și suma → faci transferul din banca ta →
          apeși „Marchează plătit” pe rândul lui. Atunci comisioanele trec pe „Plătit” și afiliatul vede că banii au plecat.
        </p>

        {/* Invite Dialog */}
        <Dialog open={showInvite} onOpenChange={setShowInvite}>
          <DialogContent>
            <DialogHeader><DialogTitle>Invită Afiliat Nou</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><label className="text-sm font-medium">Nume</label><Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Nume afiliat" /></div>
              <div><label className="text-sm font-medium">Email</label><Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@exemplu.ro" /></div>
              <p className="text-xs text-muted-foreground">Afiliatul va primi un link de înregistrare pe email. Alternativ, trimite-le linkul: /affiliate/register</p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowInvite(false)}>Anulează</Button>
                <Button onClick={() => { toast.success("Invitație trimisă!"); setShowInvite(false); setInviteEmail(""); setInviteName(""); }}>
                  Trimite Invitația
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
