export function RightSectionPreview1() {
  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-lg">
        {/* Screenshot placeholder */}
        <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900">
          <div className="p-8">
            <div className="mb-6 h-10 w-2/3 rounded-lg bg-slate-700"></div>
            <div className="grid grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg bg-slate-700"
                ></div>
              ))}
            </div>
          </div>
        </div>
        {/* Gradient fade overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background"></div>
      </div>
    </div>
  );
}
