import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stages = [
  { key: "quiz_completed", label: "Quiz Completat", color: "bg-blue-500" },
  { key: "sales_page_viewed", label: "Sales Page", color: "bg-indigo-500" },
  { key: "checkout_started", label: "Checkout", color: "bg-amber-500" },
  { key: "purchased", label: "Cumpărat", color: "bg-green-500" },
  { key: "upsell_purchased", label: "Upsell", color: "bg-emerald-500" },
  { key: "refunded", label: "Refundat", color: "bg-red-500" },
];

export default function AdminPipeline() {
  const { data: pipeline, isLoading } = trpc.admin.pipelineStats.useQuery();

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-1">Vizualizare vizuală a contactelor pe etape</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stages.map(s => (
              <Card key={s.key} className="animate-pulse"><CardContent className="p-4"><div className="h-20 bg-muted rounded" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {stages.map(stage => {
                const count = pipeline?.find((p: any) => p.stage === stage.key)?.count || 0;
                return (
                  <Card key={stage.key} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className={`w-full h-1.5 rounded-full ${stage.color} mb-2`} />
                      <CardTitle className="text-sm font-medium">{stage.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{count}</div>
                      <p className="text-xs text-muted-foreground mt-1">contacte</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Funnel Conversion</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stages.filter(s => s.key !== "refunded").map((stage, i) => {
                    const count = pipeline?.find((p: any) => p.stage === stage.key)?.count || 0;
                    const maxCount = pipeline?.reduce((max: number, p: any) => Math.max(max, p.count || 0), 0) || 1;
                    const width = Math.max(5, (count / maxCount) * 100);
                    const prevCount = i > 0 ? (pipeline?.find((p: any) => p.stage === stages[i - 1].key)?.count || 0) : count;
                    const convRate = prevCount > 0 ? Math.round((count / prevCount) * 100) : 0;
                    return (
                      <div key={stage.key} className="flex items-center gap-4">
                        <div className="w-32 text-sm text-right text-muted-foreground truncate">{stage.label}</div>
                        <div className="flex-1">
                          <div className={`h-8 rounded-md ${stage.color} flex items-center px-3 text-white text-sm font-medium`} style={{ width: `${width}%` }}>
                            {count}
                          </div>
                        </div>
                        {i > 0 && <div className="w-12 text-sm text-muted-foreground">{convRate}%</div>}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
