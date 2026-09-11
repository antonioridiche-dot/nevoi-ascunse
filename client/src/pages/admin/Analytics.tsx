import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const eventLabels: Record<string, string> = {
  quiz_start: "Quiz Start",
  quiz_complete: "Quiz Completat",
  sales_page_view: "Sales Page View",
  checkout_start: "Checkout Start",
  purchase: "Cumpărare",
  upsell_view: "Upsell View",
  upsell_purchase: "Upsell Cumpărat",
};

export default function AdminAnalytics() {
  const [days, setDays] = useState(30);
  const { data: funnel, isLoading } = trpc.admin.funnelAnalytics.useQuery({ days });
  const { data: emailStats } = trpc.admin.emailStats.useQuery();

  const funnelOrder = ["quiz_start", "quiz_complete", "sales_page_view", "checkout_start", "purchase", "upsell_view", "upsell_purchase"];
  const sortedFunnel = funnelOrder.map(event => ({
    event,
    label: eventLabels[event] || event,
    count: funnel?.find((f: any) => f.event === event)?.count || 0,
  }));
  const maxCount = Math.max(...sortedFunnel.map(f => f.count), 1);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground text-sm mt-1">Funnel analytics și statistici email</p>
          </div>
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 zile</SelectItem>
              <SelectItem value="30">30 zile</SelectItem>
              <SelectItem value="90">90 zile</SelectItem>
              <SelectItem value="365">1 an</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Funnel Conversion ({days} zile)</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}</div>
            ) : (
              <div className="space-y-3">
                {sortedFunnel.map((step, i) => {
                  const width = Math.max(3, (step.count / maxCount) * 100);
                  const prevCount = i > 0 ? sortedFunnel[i - 1].count : step.count;
                  const convRate = prevCount > 0 ? Math.round((step.count / prevCount) * 100) : 0;
                  const colors = ["bg-blue-500", "bg-blue-600", "bg-indigo-500", "bg-amber-500", "bg-green-500", "bg-emerald-400", "bg-emerald-600"];
                  return (
                    <div key={step.event} className="flex items-center gap-4">
                      <div className="w-36 text-sm text-right text-muted-foreground truncate">{step.label}</div>
                      <div className="flex-1">
                        <div className={`h-9 rounded-md ${colors[i] || "bg-gray-500"} flex items-center px-3 text-white text-sm font-medium`} style={{ width: `${width}%` }}>{step.count}</div>
                      </div>
                      {i > 0 && <div className="w-14 text-sm text-muted-foreground">{convRate}%</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Emailuri Trimise</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{emailStats?.totalSent || 0}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Rata Deschidere</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{emailStats?.openRate || 0}%</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Rata Click</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{emailStats?.clickRate || 0}%</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Dezabonări</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{emailStats?.unsubscribed || 0}</div></CardContent></Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
