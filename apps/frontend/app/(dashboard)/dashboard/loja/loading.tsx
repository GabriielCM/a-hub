import { Card, CardContent } from '@/components/ui/card';

export default function LoadingLoja() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2" />
        </div>
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
      </div>

      {/* Card de pontos skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-muted animate-pulse rounded-full" />
            <div>
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-8 w-32 bg-muted animate-pulse rounded mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtro skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
        <div className="h-10 w-[180px] bg-muted animate-pulse rounded" />
      </div>

      {/* Grid de produtos skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="aspect-square bg-muted animate-pulse" />
            <CardContent className="p-4">
              <div className="h-5 w-full bg-muted animate-pulse rounded" />
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded mt-2" />
              <div className="h-4 w-1/2 bg-muted animate-pulse rounded mt-1" />
              <div className="h-6 w-24 bg-muted animate-pulse rounded mt-3" />
              <div className="h-9 w-full bg-muted animate-pulse rounded mt-3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
