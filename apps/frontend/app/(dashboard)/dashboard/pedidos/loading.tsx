import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function OrdersLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div>
        <div className="h-8 w-40 bg-muted rounded animate-pulse" />
        <div className="h-5 w-56 bg-muted rounded animate-pulse mt-2" />
      </div>

      {/* Orders List Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-muted rounded-lg animate-pulse" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                      <div className="h-5 w-20 bg-muted rounded-full animate-pulse" />
                    </div>
                    <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                  </div>
                </div>

                <div className="flex items-center gap-3 pl-10 sm:pl-0">
                  <div className="text-right space-y-1">
                    <div className="h-4 w-12 bg-muted rounded animate-pulse ml-auto" />
                    <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="w-9 h-9 bg-muted rounded animate-pulse" />
                </div>
              </div>

              <div className="h-4 w-3/4 bg-muted rounded animate-pulse mt-2 ml-10" />
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
