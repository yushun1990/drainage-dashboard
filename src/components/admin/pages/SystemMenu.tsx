export function SystemMenu() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-800">菜单管理</h2>

      <article className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
          <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-medium text-slate-800">菜单管理模块</h3>
        <p className="text-sm text-slate-500">此功能正在开发中，敬请期待...</p>
      </article>
    </div>
  )
}
