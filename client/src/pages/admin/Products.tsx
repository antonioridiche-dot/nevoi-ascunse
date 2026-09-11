import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const products = [
  { name: "Cum să Oprești Durerea unei Despărțiri (Bărbați)", slug: "opreste-durerea-barbati", price: "67 RON", type: "ebook", gender: "male" },
  { name: "Cum să Oprești Durerea unei Despărțiri (Femei)", slug: "opreste-durerea-femei", price: "67 RON", type: "ebook", gender: "female" },
  { name: "Susținere Personală", slug: "sustinere-barbati", price: "147 RON/lună (97 în funnel)", type: "coaching", gender: "male" },
  { name: "Susținere Personală", slug: "sustinere-femei", price: "147 RON/lună (97 în funnel)", type: "coaching", gender: "female" },
  { name: "Zero Despărțiri", slug: "zero-despartiri", price: "47 RON", type: "ebook", gender: "male" },
  { name: "Zero Despărțiri", slug: "zero-despartiri", price: "47 RON", type: "ebook", gender: "female" },
];

export default function AdminProducts() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Produse</h1>
          <p className="text-muted-foreground text-sm mt-1">Produsele disponibile în funnel</p>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produs</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Preț</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Gen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map(p => (
                  <TableRow key={p.slug}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell><Badge variant="outline" className="font-mono text-xs">{p.slug}</Badge></TableCell>
                    <TableCell className="font-semibold">{p.price}</TableCell>
                    <TableCell><Badge className={p.type === "coaching" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}>{p.type}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{p.gender === "male" ? "Bărbați" : "Femei"}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Note</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Prețurile sunt configurate în Stripe. Pentru a modifica prețurile, actualizează-le în Stripe Dashboard.</p>
            <p>Fișierele PDF ale cărților sunt stocate pe S3.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
