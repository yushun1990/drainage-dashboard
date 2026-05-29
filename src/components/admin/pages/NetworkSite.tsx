export function NetworkSite() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-800">站点管理</h2>

      <article className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
          <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-medium text-slate-800">站点管理模块</h3>
        <p className="text-sm text-slate-500">此功能正在开发中，敬请期待...</p>
      </article>
    </div>
  )
}
