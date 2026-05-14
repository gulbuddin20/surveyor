export function PageLoading() {
  return (
    <div className="atlas-reveal space-y-5" aria-busy="true" aria-live="polite">
      <div className="rounded-[2rem] border border-[color:rgba(22,37,29,0.08)] bg-[color:rgba(255,249,234,0.64)] p-5 shadow-sm shadow-black/5">
        <div className="h-4 w-32 animate-pulse rounded-full bg-[color:rgba(22,37,29,0.12)]" />
        <div className="mt-4 h-9 w-full max-w-xl animate-pulse rounded-full bg-[color:rgba(22,37,29,0.14)]" />
        <div className="mt-3 h-4 w-full max-w-3xl animate-pulse rounded-full bg-[color:rgba(22,37,29,0.08)]" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="rounded-[2rem] border border-[color:rgba(22,37,29,0.08)] bg-[color:rgba(255,249,234,0.54)] p-5"
          >
            <div className="h-5 w-2/3 animate-pulse rounded-full bg-[color:rgba(22,37,29,0.12)]" />
            <div className="mt-5 h-24 animate-pulse rounded-[1.25rem] bg-[color:rgba(22,37,29,0.08)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
