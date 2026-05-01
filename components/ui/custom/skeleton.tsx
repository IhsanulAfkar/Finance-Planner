import { Card, CardContent, CardHeader } from "../card";
import { Skeleton } from "../skeleton";

export function TaskCardSkeleton() {
  return (
    <Card className="space-y-3">
      <CardHeader className="flex justify-between">
        <Skeleton className="h-4 w-[60%]" />
        <Skeleton className="h-4 w-10" />
      </CardHeader>

      <CardContent className="space-y-2">
        <Skeleton className="w-full h-32 rounded-md" />
        <Skeleton className="h-3 w-[40%]" />
      </CardContent>
    </Card>
  )
}
export function ColumnSkeleton() {
  return (
    <div className="w-[320px] shrink-0 flex flex-col rounded-xl border bg-muted/40">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-6 rounded-md" />
      </div>

      <div className="flex flex-col gap-3 p-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <TaskCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export const ChartSkeleton = () => {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-40" />

      <Skeleton className="h-[250px] w-full rounded-md" />
    </div>
  );
};
export const EmptyState = ({ message }: { message: string }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[250px] text-center text-gray-500">
      <p className="text-sm">{message}</p>
    </div>
  );
};

export function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 flex justify-between items-center">
        <div className="space-y-2">
          {/* title */}
          <Skeleton className="h-4 w-24" />

          {/* main value */}
          <Skeleton className="h-7 w-20" />

          {/* last value */}
          <Skeleton className="h-3 w-16" />
        </div>

        {/* trend */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-12" />
        </div>
      </CardContent>
    </Card>
  );
}