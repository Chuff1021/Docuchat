export default function DashboardLoading() {
  return (
    <div className="p-6 lg:p-8">
      <div className="animate-pulse space-y-6">
        {/* Header skeleton */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-slate-800 rounded w-32" />
            <div className="h-8 bg-slate-800 rounded w-56" />
            <div className="h-4 bg-slate-800 rounded w-72" />
          </div>
          <div className="h-10 bg-slate-800 rounded-xl w-28" />
        </div>

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-800 rounded-2xl" />
          ))}
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-800 rounded-2xl" />
          ))}
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 h-80 bg-slate-800 rounded-2xl" />
          <div className="lg:col-span-2 h-80 bg-slate-800 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
