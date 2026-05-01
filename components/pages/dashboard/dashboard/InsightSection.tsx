import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton';
import useDashboardInsight from '@/hooks/datasource/useDashboardInsight'
import { AlertTriangle, Lightbulb, TrendingUp } from 'lucide-react';
import { NextPage } from 'next'

const iconMap: Record<string, any> = {
  positive: TrendingUp,
  warning: AlertTriangle,
  neutral: Lightbulb,
};

const colorMap: Record<string, string> = {
  positive: "text-green-600 bg-green-50",
  warning: "text-red-500 bg-red-50",
  neutral: "text-yellow-600 bg-yellow-50",
};
const InsightSection = () => {
  const { data: insights = [], isLoading } = useDashboardInsight();

  return (
    <Card>
      <CardHeader>
        <CardTitle>💡 Insights</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 items-start">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))
        ) : insights.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No insights available yet.
          </p>
        ) : (
          insights.map((text, idx) => {

            const Icon = iconMap[text.type]

            const color = colorMap[text.type]

            return (
              <div
                key={idx}
                className="flex gap-3 p-3 rounded-lg border bg-card-2"
              >
                <div className={`p-2 rounded-full ${color}`}>
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-relaxed">{text.title}</p>
                  <p className="text-xs leading-relaxed">{text.description}</p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default InsightSection