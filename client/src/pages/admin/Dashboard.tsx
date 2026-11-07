import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShoppingCart, DollarSign, UserCheck, Mail, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const { data: overview, isLoading } = trpc.analytics.overview.useQuery();
  const { data: emailStats } = trpc.analytics.emailStats.useQuery();

  const stats = [
    { title: "Total Contacte", value: overview?.totalContacts || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Total Comenzi", value: overview?.totalOrders || 0, icon: ShoppingCart, color: "text-green-600", bg: "bg-green-50" },
    { title: "Venituri (RON)", value: `${(overview?.totalRevenue || 0).toFixed(0)}`, icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
    { title: "Afiliați Activi", value: overview?.totalAffiliates || 0, icon: UserCheck, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Emailuri Trimise", value: emailStats?.sent || 0, icon: Mail, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Rata Deschidere", value: emailStats?.sent ? `${Math.round(((emailStats?.opened || 0) / emailStats.sent) * 100)}%` : "0%", icon: TrendingUp, color: "text-teal-600", bg: "bg-teal-50" },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Privire de ansamblu asupra platformei Peste Despărțire</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6"><div className="h-16 bg-muted rounded" /></CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <Card key={stat.title} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acțiuni Rapide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a href="/admin/contacts" className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm">
                → Gestionează Contacte
              </a>
              <a href="/admin/emails" className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm">
                → Editează Secvențe Email
              </a>
              <a href="/admin/affiliates" className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm">
                → Gestionează Afiliați
              </a>
              <a href="/admin/analytics" className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm">
                → Vezi Funnel Analytics
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Linkuri Funnel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a href="/test-vindecare" target="_blank" className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm">
                → Quiz (pagina principală)
              </a>
              <a href="/femei/oprestedurerea" target="_blank" className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm">
                → Sales Page (Femei)
              </a>
              <a href="/barbati/oprestedurerea" target="_blank" className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm">
                → Sales Page (Bărbați)
              </a>
              <a href="/affiliate/register" target="_blank" className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm">
                → Înregistrare Afiliați
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
