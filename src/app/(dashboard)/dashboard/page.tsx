export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-muted aspect-video rounded-xl" />
        ))}
      </div>
      <div className="bg-muted min-h-screen flex-1 rounded-xl md:min-h-min" />
    </div>
  );
}
