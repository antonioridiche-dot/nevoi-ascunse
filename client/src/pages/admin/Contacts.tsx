import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function AdminContacts() {
  const [gender, setGender] = useState<"male" | "female" | undefined>(undefined);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const { data, isLoading } = trpc.contacts.list.useQuery({ limit, offset, gender, status });

  const statusColors: Record<string, string> = {
    lead: "bg-blue-100 text-blue-800",
    customer: "bg-green-100 text-green-800",
    refunded: "bg-red-100 text-red-800",
    unsubscribed: "bg-gray-100 text-gray-800",
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Contacte</h1>
          <a href="/api/admin/export-contacts" className="rounded-md bg-[#1b2d4f] px-4 py-2 text-sm font-bold text-white hover:bg-[#2d4a7a] transition-colors">Exportă CSV (toate contactele)</a>
        </div>
          <p className="text-muted-foreground text-sm mt-1">CRM — Gestionează toți contactele din baza de date</p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Select value={gender || "all"} onValueChange={(v) => { setGender(v === "all" ? undefined : v as any); setOffset(0); }}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Gen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toți</SelectItem>
              <SelectItem value="male">Bărbați</SelectItem>
              <SelectItem value="female">Femei</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status || "all"} onValueChange={(v) => { setStatus(v === "all" ? undefined : v); setOffset(0); }}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toți</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Se încarcă...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nume</TableHead>
                    <TableHead>Gen</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scor</TableHead>
                    <TableHead>Pipeline</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.contacts && data.contacts.length > 0 ? data.contacts.map((contact: any) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium text-sm">{contact.email}</TableCell>
                      <TableCell className="text-sm">{contact.firstName || "-"}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{contact.gender === "male" ? "M" : "F"}</Badge></TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[contact.status] || ""}`}>
                          {contact.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{contact.procentSanse || "-"}%</TableCell>
                      <TableCell className="text-sm capitalize">{contact.pipelineStage || "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {contact.createdAt ? new Date(contact.createdAt).toLocaleDateString("ro-RO") : "-"}
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nu există contacte</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>
            ← Anterior
          </Button>
          <span className="text-sm text-muted-foreground">Pagina {Math.floor(offset / limit) + 1}</span>
          <Button variant="outline" size="sm" disabled={!data?.contacts || data.contacts.length < limit} onClick={() => setOffset(offset + limit)}>
            Următor →
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
