export default function CarteirinhaLoading() {
  return (
    <div className="space-y-8">
      {/* Page Header Skeleton */}
      <div>
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-72 bg-muted rounded animate-pulse mt-2" />
      </div>

      {/* Member Card Skeleton */}
      <section>
        <div className="max-w-md mx-auto">
          <div className="bg-muted rounded-2xl p-6 h-80 animate-pulse" />
        </div>
      </section>

      {/* Benefits Section Skeleton */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-muted rounded-lg h-9 w-9 animate-pulse" />
          <div>
            <div className="h-6 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-48 bg-muted rounded animate-pulse mt-1" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg overflow-hidden">
              <div className="aspect-video bg-muted animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
                <div className="h-4 w-full bg-muted rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
