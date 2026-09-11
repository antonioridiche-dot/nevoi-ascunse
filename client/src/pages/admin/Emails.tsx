import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Pencil, Clock } from "lucide-react";
import { toast } from "sonner";

export default function AdminEmails() {
  const [campaign, setCampaign] = useState<"male" | "female">("female");
  const { data: emails, isLoading, refetch } = trpc.admin.emailSequences.useQuery({ campaign });
  const updateEmail = trpc.admin.updateEmailSequence.useMutation({
    onSuccess: () => { toast.success("Email actualizat!"); refetch(); setEditing(null); },
    onError: (err: any) => toast.error(err.message),
  });

  const [editing, setEditing] = useState<any>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editPreview, setEditPreview] = useState("");
  const [editBody, setEditBody] = useState("");

  const openEdit = (email: any) => {
    setEditing(email);
    setEditSubject(email.subject);
    setEditPreview(email.previewText || "");
    setEditBody(email.body || "");
  };

  const saveEdit = () => {
    if (!editing) return;
    updateEmail.mutate({ id: editing.id, subject: editSubject, previewText: editPreview, bodyHtml: editBody });
  };

  const formatDelay = (mins: number) => {
    if (mins < 60) return `${Math.round(mins)}m`;
    if (mins < 1440) return `${Math.round(mins / 60)}h`;
    return `${Math.round(mins / 1440)}d`;
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Secvențe Email</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestionează emailurile din campanii</p>
        </div>

        <Select value={campaign} onValueChange={(v) => setCampaign(v as any)}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="female">Campanie Femei</SelectItem>
            <SelectItem value="male">Campanie Bărbați</SelectItem>
          </SelectContent>
        </Select>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Se încarcă...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Subiect</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead className="w-24">Delay</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-20">Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emails?.map((email: any) => (
                    <TableRow key={email.id}>
                      <TableCell className="text-sm text-muted-foreground">{email.position + 1}</TableCell>
                      <TableCell className="font-medium text-sm max-w-[300px] truncate">{email.subject}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{email.previewText || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm"><Clock className="h-3 w-3 text-muted-foreground" />{formatDelay(email.delaySeconds / 60)}</div>
                      </TableCell>
                      <TableCell>
                        {email.body && !email.body.includes("BODY_NEEDED") ? (
                          <Badge className="bg-green-100 text-green-800 text-xs">Complet</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 text-xs">Lipsă Body</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(email)}><Pencil className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Editează Email #{editing?.position !== undefined ? editing.position + 1 : ''}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><label className="text-sm font-medium">Subiect</label><Input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} /></div>
              <div><label className="text-sm font-medium">Preview Text</label><Input value={editPreview} onChange={(e) => setEditPreview(e.target.value)} /></div>
              <div>
                <label className="text-sm font-medium">Body (HTML)</label>
                <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={15} className="font-mono text-xs" />
                <p className="text-xs text-muted-foreground mt-1">Variabile: {"{procent_sanse}"}, {"{incercari_reparare}"}, {"{first_name}"}, {"{unsubscribe_link}"}</p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditing(null)}>Anulează</Button>
                <Button onClick={saveEdit} disabled={updateEmail.isPending}>{updateEmail.isPending ? "Se salvează..." : "Salvează"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
