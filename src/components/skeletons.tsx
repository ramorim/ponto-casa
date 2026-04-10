import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function PunchSkeleton() {
  return (
    <main className="flex flex-1 flex-col p-4 gap-4 max-w-lg mx-auto w-full">
      <div className="text-center space-y-2 py-2">
        <Skeleton className="h-4 w-32 mx-auto" />
        <Skeleton className="h-9 w-40 mx-auto" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
      <div className="grid grid-cols-1 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-md" />
        ))}
      </div>
    </main>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function HistoryTableSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-3">
              <Skeleton className="h-4 w-20" />
              <div className="flex gap-3">
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-10" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ClosingSkeleton() {
  return (
    <>
      <Skeleton className="h-6 w-32 mx-auto" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-3 text-center space-y-2">
              <Skeleton className="h-5 w-5 mx-auto" />
              <Skeleton className="h-7 w-16 mx-auto" />
              <Skeleton className="h-3 w-20 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-10 w-full" />
    </>
  );
}

export function ProfileSkeleton() {
  return (
    <main className="flex flex-1 flex-col p-4 gap-4 max-w-lg mx-auto w-full">
      <Skeleton className="h-7 w-32" />
      <Card>
        <CardHeader className="pb-3 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </main>
  );
}
