export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">系统概览</h2>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '监测站点', value: '12', unit: '个', color: 'blue' },
          { label: '管网长度', value: '45.8', unit: 'km', color: 'cyan' },
          { label: '今日告警', value: '3', unit: '条', color: 'amber' },
          { label: '系统状态', value: '正常', unit: '', color: 'emerald' },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <span className="text-sm text-slate-500">{item.label}</span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className={`text-2xl font-semibold ${
                item.color === 'amber' ? 'text-amber-600' :
                item.color === 'emerald' ? 'text-emerald-600' :
                'text-slate-800'
              }`}>
                {item.value}
              </span>
              {item.unit && <span className="text-sm text-slate-400">{item.unit}</span>}
            </div>
          </article>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-medium text-slate-700">最近告警</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-600">站点155雨污混接预警</span>
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">高</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-600">区域B管道淤积告警</span>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">中</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">区域C晴雨比异常</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">低</span>
            </div>
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-medium text-slate-700">系统状态</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-600">数据采集服务</span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                运行中
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-600">告警分析引擎</span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                运行中
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">地图渲染服务</span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                运行中
              </span>
            </div>
          </div>
        </article>
      </div>

      <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-medium text-slate-700">快速操作</h3>
        <div className="flex gap-3">
          <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
            刷新数据
          </button>
          <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
            导出报表
          </button>
          <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
            系统日志
          </button>
        </div>
      </article>
    </div>
  )
}
