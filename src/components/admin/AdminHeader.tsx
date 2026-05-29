import { Link } from 'react-router-dom'

function ArrowLeftIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  )
}

export function AdminHeader() {
  return (
    <header className="relative h-16 shrink-0 border-b border-slate-200 bg-white shadow-sm">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100 hover:border-slate-300"
            title="返回可视化看板"
          >
            <ArrowLeftIcon />
          </Link>

          <h1 className="text-xl font-semibold text-slate-800">
            后台管理系统
          </h1>
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>演示用户</span>
          </span>
        </div>
      </div>
    </header>
  )
}
