import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Plus, FlaskConical } from "lucide-react";
import { toast } from "sonner";

export default function AdminAbTests() {
  const { data: tests, isLoading, refetch } = trpc.admin.abTests.useQuery();
  const createTest = trpc.admin.createAbTest.useMutation({
    onSuccess: () => { toast.success("Test A/B creat!"); refetch(); setShowCreate(false); },
    onError: (err: any) => toast.error(err.message),
  });
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"page_headline" | "email_subject" | "page_layout">("page_headline");
  const [variantA, setVariantA] = useState("");
  const [variantB, setVariantB] = useState("");

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Teste A/B</h1>
            <p className="text-muted-foreground text-sm mt-1">Split testing pentru pagini și emailuri</p>
          </div>
          <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> Test Nou</Button>
        </div>
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Se încarcă...</div>
            ) : tests && tests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nume</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Varianta A</TableHead>
                    <TableHead>Varianta B</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Creat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests.map((test: any) => {
                    const variants = typeof test.variants === "string" ? JSON.parse(test.variants) : test.variants;
                    return (
                      <TableRow key={test.id}>
                        <TableCell className="font-medium">{test.name}</TableCell>
                        <TableCell><Badge variant="outline">{test.type}</Badge></TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{variants?.a || "-"}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{variants?.b || "-"}</TableCell>
                        <TableCell>
                          <Badge className={test.status === "running" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>{test.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{test.createdAt ? new Date(test.createdAt).toLocaleDateString("ro-RO") : "-"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="p-12 text-center">
                <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nu există teste A/B active</p>
                <Button variant="outline" className="mt-4" onClick={() => setShowCreate(true)}>Creează primul test</Button>
              </div>
            )}
          </CardContent>
        </Card>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader><DialogTitle>Creează Test A/B</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><label className="text-sm font-medium">Nume Test</label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Headline Sales Page V2" /></div>
              <div>
                <label className="text-sm font-medium">Tip</label>
                <Select value={type} onValueChange={(v: any) => setType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="page_headline">Headline Pagină</SelectItem>
                    <SelectItem value="email_subject">Subiect Email</SelectItem>
                    <SelectItem value="page_layout">Layout Pagină</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><label className="text-sm font-medium">Varianta A</label><Input value={variantA} onChange={e => setVariantA(e.target.value)} /></div>
              <div><label className="text-sm font-medium">Varianta B</label><Input value={variantB} onChange={e => setVariantB(e.target.value)} /></div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreate(false)}>Anulează</Button>
                <Button onClick={() => createTest.mutate({ name, type, variantA, variantB })} disabled={createTest.isPending || !name || !variantA || !variantB}>
                  {createTest.isPending ? "Se creează..." : "Creează"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
