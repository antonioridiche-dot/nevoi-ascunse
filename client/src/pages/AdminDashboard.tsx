import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Users, DollarSign, Mail, TrendingUp, BarChart3, Eye, MousePointerClick, ShoppingCart, UserPlus, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { AdminLoginForm } from "@/components/DashboardLayout";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth();
  const [, navigate] = useLocation();

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin w-8 h-8" /></div>;
  // Fara sesiune -> formularul de login (inainte era un buton care ducea in bucla pe /admin).
  if (!user) return <AdminLoginForm />;
  if (user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-lg">Contul {user.email} nu are drepturi de administrator.</p>
        <Button variant="outline" onClick={() => logout()}>Deconectare</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">Peste Despărțire — Admin</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{user.name || user.email}</span>
          <Button variant="ghost" size="sm" onClick={() => logout()}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contacts">Contacts / CRM</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="emails">Email Stats</TabsTrigger>
            <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
            <TabsTrigger value="ab-tests">A/B Tests</TabsTrigger>
            <TabsTrigger value="funnel">Funnel Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="contacts"><ContactsTab /></TabsContent>
          <TabsContent value="pipeline"><PipelineTab /></TabsContent>
          <TabsContent value="emails"><EmailStatsTab /></TabsContent>
          <TabsContent value="affiliates"><AffiliatesTab /></TabsContent>
          <TabsContent value="ab-tests"><ABTestsTab /></TabsContent>
          <TabsContent value="funnel"><FunnelAnalyticsTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ============ OVERVIEW TAB ============
function OverviewTab() {
  const { data: stats } = trpc.admin.stats.useQuery();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Contacts" value={stats?.totalContacts || 0} />
        <StatCard icon={ShoppingCart} label="Total Orders" value={stats?.totalOrders || 0} />
        <StatCard icon={DollarSign} label="Revenue (RON)" value={`${((stats?.totalRevenue || 0) / 100).toFixed(0)} RON`} />
        <StatCard icon={Mail} label="Emails Sent" value={stats?.totalEmailsSent || 0} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Leads by Gender</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-8">
              <div>
                <p className="text-2xl font-bold">{stats?.maleLeads || 0}</p>
                <p className="text-sm text-gray-500">Bărbați</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.femaleLeads || 0}</p>
                <p className="text-sm text-gray-500">Femei</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Conversion Rate</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.conversionRate || "0"}%</p>
            <p className="text-sm text-gray-500">Quiz → Purchase</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============ CONTACTS TAB ============
function ContactsTab() {
  const [gender, setGender] = useState<"male" | "female" | undefined>();
  const [page, setPage] = useState(0);
  const { data } = trpc.admin.listContacts.useQuery({ gender, limit: 25, offset: page * 25 });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={!gender ? "default" : "outline"} size="sm" onClick={() => setGender(undefined)}>All</Button>
        <Button variant={gender === "male" ? "default" : "outline"} size="sm" onClick={() => setGender("male")}>Bărbați</Button>
        <Button variant={gender === "female" ? "default" : "outline"} size="sm" onClick={() => setGender("female")}>Femei</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Gender</th>
                  <th className="px-4 py-3 text-left font-medium">Score</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Lead Score</th>
                  <th className="px-4 py-3 text-left font-medium">Stage</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {data?.contacts?.map((c: any) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{c.email}</td>
                    <td className="px-4 py-3">{c.firstName || "—"}</td>
                    <td className="px-4 py-3"><Badge variant="outline">{c.gender === "male" ? "M" : "F"}</Badge></td>
                    <td className="px-4 py-3">{c.procentSanse || "—"}%</td>
                    <td className="px-4 py-3">
                      <Badge variant={c.status === "customer" ? "default" : c.status === "refunded" ? "destructive" : "secondary"}>
                        {c.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{c.leadScore || 0}</td>
                    <td className="px-4 py-3">{c.pipelineStage || "—"}</td>
                    <td className="px-4 py-3">{new Date(c.createdAt).toLocaleDateString("ro-RO")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">Total: {data?.total || 0}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}

// ============ PIPELINE TAB ============
function PipelineTab() {
  const { data } = trpc.admin.pipelineStats.useQuery();

  const stages = [
    { key: "quiz_completed", label: "Quiz Completed", color: "bg-blue-100 text-blue-800" },
    { key: "sales_page_viewed", label: "Sales Page Viewed", color: "bg-yellow-100 text-yellow-800" },
    { key: "checkout_started", label: "Checkout Started", color: "bg-orange-100 text-orange-800" },
    { key: "purchased", label: "Purchased", color: "bg-green-100 text-green-800" },
    { key: "upsell_purchased", label: "Upsell Purchased", color: "bg-purple-100 text-purple-800" },
    { key: "refunded", label: "Refunded", color: "bg-red-100 text-red-800" },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Pipeline Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stages.map(stage => (
          <Card key={stage.key}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{data?.find((s: any) => s.stage === stage.key)?.count || 0}</p>
              <Badge className={stage.color}>{stage.label}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============ EMAIL STATS TAB ============
function EmailStatsTab() {
  const { data } = trpc.admin.emailStats.useQuery();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Email Performance</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Mail} label="Total Sent" value={data?.totalSent || 0} />
        <StatCard icon={Eye} label="Opened" value={`${data?.openRate || 0}%`} />
        <StatCard icon={MousePointerClick} label="Clicked" value={`${data?.clickRate || 0}%`} />
        <StatCard icon={UserPlus} label="Unsubscribed" value={data?.unsubscribed || 0} />
      </div>

      {data?.bySequence && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">By Sequence</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left">Sequence</th>
                  <th className="px-4 py-2 text-left">Sent</th>
                  <th className="px-4 py-2 text-left">Opened</th>
                  <th className="px-4 py-2 text-left">Clicked</th>
                </tr>
              </thead>
              <tbody>
                {data.bySequence.map((s: any) => (
                  <tr key={s.name} className="border-b">
                    <td className="px-4 py-2">{s.name}</td>
                    <td className="px-4 py-2">{s.sent}</td>
                    <td className="px-4 py-2">{s.opened}</td>
                    <td className="px-4 py-2">{s.clicked}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============ AFFILIATES TAB ============
function AffiliatesTab() {
  const { data: affiliatesList } = trpc.affiliates.listAll.useQuery();
  const updateStatus = trpc.affiliate.updateStatus.useMutation();
  const markPaid = trpc.affiliates.markPaid.useMutation();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Affiliate Management</h3>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Code</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Earned</th>
                  <th className="px-4 py-3 text-left font-medium">Paid</th>
                  <th className="px-4 py-3 text-left font-medium">Metodă / IBAN</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {affiliatesList?.map((a: any) => (
                  <tr key={a.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{a.name}</td>
                    <td className="px-4 py-3">{a.email}</td>
                    <td className="px-4 py-3 font-mono text-xs">{a.referralCode}</td>
                    <td className="px-4 py-3">
                      <Badge variant={a.status === "active" ? "default" : a.status === "suspended" ? "destructive" : "secondary"}>
                        {a.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{(a.totalEarned / 100).toFixed(2)} RON</td>
                    <td className="px-4 py-3">{(a.totalPaid / 100).toFixed(2)} RON</td>
                    <td className="px-4 py-3 text-xs">
                      {a.payoutMethod ? (
                        <span>
                          {({ stripe: "Stripe (automat)", iban: "IBAN", paypal: "PayPal", wise: "Wise", revolut: "Revolut" } as Record<string, string>)[a.payoutMethod] || a.payoutMethod}
                          {a.payoutDetails ? <span className="block font-mono">{a.payoutDetails}</span> : null}
                        </span>
                      ) : <span className="text-gray-400">nesetată</span>}
                    </td>
                    <td className="px-4 py-3 flex gap-1">
                      {a.status === "pending" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ affiliateId: a.id, status: "active" })}>
                          Approve
                        </Button>
                      )}
                      {a.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={markPaid.isPending}
                          title={a.dueCents > 0 ? "Marchează ca plătite comisioanele scadente (" + (a.dueCents / 100).toFixed(2) + " RON)" : "Nimic scadent momentan"}
                          onClick={async () => {
                            try {
                              const res = await markPaid.mutateAsync({ affiliateId: a.id });
                              toast.success("Marcat plătit: " + res.amount.toFixed(2) + " RON (" + res.count + " comisioane).");
                            } catch (err: any) {
                              toast.error(err?.message || "Nu am putut marca plata.");
                            }
                          }}
                        >
                          {a.dueCents > 0 ? "Mark paid (" + (a.dueCents / 100).toFixed(2) + ")" : "Mark paid"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ A/B TESTS TAB ============
function ABTestsTab() {
  const { data } = trpc.admin.abTests.useQuery();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">A/B Split Tests</h3>
      <p className="text-sm text-gray-500">Create and manage split tests for sales pages and email subjects.</p>

      {data?.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            No active A/B tests. Create one from the funnel settings.
          </CardContent>
        </Card>
      )}

      {data?.map((test: any) => (
        <Card key={test.id}>
          <CardHeader>
            <CardTitle className="text-sm">{test.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded">
                <p className="font-medium">Variant A</p>
                <p className="text-sm text-gray-500">{test.variantA}</p>
                <p className="text-lg font-bold mt-2">{test.conversionsA || 0} conversions</p>
              </div>
              <div className="p-3 border rounded">
                <p className="font-medium">Variant B</p>
                <p className="text-sm text-gray-500">{test.variantB}</p>
                <p className="text-lg font-bold mt-2">{test.conversionsB || 0} conversions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============ FUNNEL ANALYTICS TAB ============
function FunnelAnalyticsTab() {
  const { data } = trpc.admin.funnelAnalytics.useQuery({ days: 30 });

  const events = [
    { key: "quiz_started", label: "Quiz Started", icon: UserPlus },
    { key: "quiz_completed", label: "Quiz Completed", icon: Users },
    { key: "sales_page_viewed", label: "Sales Page Viewed", icon: Eye },
    { key: "checkout_started", label: "Checkout Started", icon: ShoppingCart },
    { key: "purchase_completed", label: "Purchase Completed", icon: DollarSign },
    { key: "upsell_purchased", label: "Upsell Purchased", icon: TrendingUp },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Funnel Analytics (Last 30 Days)</h3>

      <div className="space-y-2">
        {events.map((event, i) => {
          const count = data?.find((d: any) => d.event === event.key)?.count || 0;
          const prevCount = i > 0 ? (data?.find((d: any) => d.event === events[i - 1].key)?.count || 1) : count;
          const dropoff = i > 0 && prevCount > 0 ? ((1 - count / prevCount) * 100).toFixed(1) : null;

          return (
            <div key={event.key} className="flex items-center gap-4 p-4 bg-white border rounded-lg">
              <event.icon className="w-5 h-5 text-gray-500" />
              <div className="flex-1">
                <p className="font-medium">{event.label}</p>
              </div>
              <p className="text-xl font-bold">{count}</p>
              {dropoff && <Badge variant="secondary" className="text-xs">-{dropoff}% dropoff</Badge>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ STAT CARD COMPONENT ============
function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 bg-gray-100 rounded-lg">
          <Icon className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
