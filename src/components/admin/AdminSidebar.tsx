import { Link, useLocation } from 'react-router-dom'

export interface AdminMenuItem {
  id: string
  label: string
  path: string
}

export interface AdminPage {
  id: string
  label: string
  path: string
  icon: React.ReactNode
  children?: AdminMenuItem[]
}

interface AdminSidebarProps {
  pages: AdminPage[]
  currentPage: string
  onPageChange: (pageId: string) => void
  collapsed: boolean
  onToggle: () => void
  expandedMenus: Set<string>
  onToggleMenu: (menuId: string) => void
}

function ChevronRightIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <span className={className || 'inline-flex h-3 w-3 items-center justify-center'}>
      <svg
        className="h-3 w-3"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </span>
  )
}

export function AdminSidebar({
  pages,
  currentPage: _currentPage,
  onPageChange,
  collapsed,
  onToggle,
  expandedMenus,
  onToggleMenu,
}: AdminSidebarProps) {
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(path)
  }

  const isChildActive = (children?: AdminMenuItem[]) => {
    if (!children) return false
    return children.some((child) => isActive(child.path))
  }

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-slate-200 bg-white transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      <nav className="flex flex-col gap-1 p-2">
        {pages.map((page) => {
          const active = isActive(page.path)
          const hasChildren = page.children && page.children.length > 0
          const isExpanded = expandedMenus.has(page.id)
          const childActive = isChildActive(page.children)

          return (
            <div key={page.id}>
              {/* 父菜单项 */}
              <div
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  active || childActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span
                  className="flex shrink-0 cursor-pointer"
                  onClick={() => hasChildren && !collapsed && onToggleMenu(page.id)}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {page.icon}
                  </svg>
                </span>

                {!collapsed && (
                  <>
                    {hasChildren ? (
                      <button
                        onClick={() => onToggleMenu(page.id)}
                        className="flex flex-1 items-center justify-between"
                      >
                        <span>{page.label}</span>
                        <ChevronDownIcon
                          className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                    ) : (
                      <>
                        <Link
                          to={page.path}
                          onClick={() => onPageChange(page.id)}
                          className="flex flex-1 truncate"
                        >
                          {page.label}
                        </Link>
                        {active && <ChevronRightIcon />}
                      </>
                    )}
                  </>
                )}

                {collapsed && (active || childActive) && (
                  <span className="absolute right-2 h-2 w-2 rounded-full bg-blue-500" />
                )}
              </div>

              {/* 子菜单 */}
              {!collapsed && hasChildren && isExpanded && (
                <div className="ml-4 mt-1 space-y-0.5">
                  {page.children!.map((child) => {
                    const childActive = isActive(child.path)

                    return (
                      <Link
                        key={child.id}
                        to={child.path}
                        onClick={() => onPageChange(child.id)}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all ${
                          childActive
                            ? 'bg-blue-50 text-blue-600 font-medium'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        }`}
                      >
                        <span className="h-1 w-1 rounded-full border border-slate-300" />
                        <span className="truncate">{child.label}</span>
                        {childActive && <ChevronRightIcon />}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* 底部区域 */}
      <div className="mt-auto p-2 space-y-1">
        {/* 系统信息 */}
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          {collapsed ? (
            <div className="flex justify-center">
              <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-xs font-medium text-slate-500">排水监测系统</div>
              <div className="text-xs text-slate-400">v1.0.0</div>
            </div>
          )}
        </div>

        {/* 折叠按钮 */}
        <button
          onClick={onToggle}
          title={collapsed ? '展开菜单' : '折叠菜单'}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 transition-all hover:bg-slate-100 hover:border-slate-300"
        >
          {collapsed ? (
            <ChevronRightIcon />
          ) : (
            <>
              <ChevronLeftIcon />
              <span>收起</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
