export function NetworkDevice() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-800">设备管理</h2>

      <article className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
          <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-medium text-slate-800">设备管理模块</h3>
        <p className="text-sm text-slate-500">此功能正在开发中，敬请期待...</p>
      </article>
    </div>
  )
}
