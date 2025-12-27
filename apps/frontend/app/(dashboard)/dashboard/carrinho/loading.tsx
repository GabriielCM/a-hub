import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function CartLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div>
        <div className="h-8 w-56 bg-muted animate-pulse rounded" />
        <div className="h-5 w-40 bg-muted animate-pulse rounded mt-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items Skeleton */}
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Image Skeleton */}
                  <div className="flex-shrink-0 w-full sm:w-24 h-24 bg-muted animate-pulse rounded-lg" />

                  {/* Content Skeleton */}
                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                    <div className="flex items-center justify-between mt-4">
                      <div className="h-8 w-28 bg-muted animate-pulse rounded" />
                      <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Skeleton */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="h-6 w-40 bg-muted animate-pulse rounded" />
              <div className="h-4 w-56 bg-muted animate-pulse rounded mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              </div>
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 w-28 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                </div>
                <div className="flex justify-between">
                  <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-5 w-20 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-12 w-full bg-muted animate-pulse rounded-lg" />
              </div>
              <div className="h-11 w-full bg-muted animate-pulse rounded-md mt-4" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
