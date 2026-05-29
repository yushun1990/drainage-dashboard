export function AlertManagement() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-800">告警管理</h2>

      <article className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-amber-200 bg-amber-50">
          <svg className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-medium text-slate-800">告警管理模块</h3>
        <p className="text-sm text-slate-500">此功能正在开发中，敬请期待...</p>
      </article>
    </div>
  )
}
