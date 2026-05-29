import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AdminHeader } from './AdminHeader'
import { AdminSidebar, type AdminPage, type AdminMenuItem } from './AdminSidebar'
import { AdminDashboard } from './pages/AdminDashboard'
import { DataAnalysis } from './pages/DataAnalysis'
import { AlertManagement } from './pages/AlertManagement'
import { NetworkDevice } from './pages/NetworkDevice'
import { NetworkZone } from './pages/NetworkZone'
import { NetworkSite } from './pages/NetworkSite'
import { SystemUser } from './pages/SystemUser'
import { SystemMenu } from './pages/SystemMenu'
import { SystemPermission } from './pages/SystemPermission'
import { SystemRole } from './pages/SystemRole'
import { SystemConfig } from './pages/SystemConfig'

const adminPages: AdminPage[] = [
  {
    id: 'dashboard',
    label: '系统概览',
    path: '/admin',
    icon: <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />,
  },
  {
    id: 'data-analysis',
    label: '数据分析',
    path: '/admin/data-analysis',
    icon: (
      <>
        <path d="M3 3v18h18" />
        <path d="M18 17V9" />
        <path d="M13 17V5" />
        <path d="M8 17v-3" />
      </>
    ),
  },
  {
    id: 'alerts',
    label: '告警管理',
    path: '/admin/alerts',
    icon: (
      <>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </>
    ),
  },
  {
    id: 'network',
    label: '管网管理',
    path: '/admin/network',
    icon: <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />,
    children: [
      { id: 'network-device', label: '设备管理', path: '/admin/network/device' },
      { id: 'network-zone', label: '区域管理', path: '/admin/network/zone' },
      { id: 'network-site', label: '站点管理', path: '/admin/network/site' },
    ] as AdminMenuItem[],
  },
  {
    id: 'system',
    label: '系统管理',
    path: '/admin/system',
    icon: <circle cx="12" cy="12" r="3" />,
    children: [
      { id: 'system-user', label: '用户管理', path: '/admin/system/user' },
      { id: 'system-menu', label: '菜单管理', path: '/admin/system/menu' },
      { id: 'system-permission', label: '权限管理', path: '/admin/system/permission' },
      { id: 'system-role', label: '角色管理', path: '/admin/system/role' },
      { id: 'system-config', label: '配置管理', path: '/admin/system/config' },
    ] as AdminMenuItem[],
  },
]

export function AdminShell() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set())

  const handlePageChange = (pageId: string) => {
    setCurrentPage(pageId)
  }

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev)
  }

  const toggleMenuExpansion = (menuId: string) => {
    setExpandedMenus((prev) => {
      const next = new Set(prev)
      if (next.has(menuId)) {
        next.delete(menuId)
      } else {
        next.add(menuId)
      }
      return next
    })
  }

  return (
    <main className="relative h-screen min-h-[720px] overflow-hidden bg-slate-50 text-slate-800">
      <div className="flex h-full flex-col">
        <AdminHeader />

        <div className="flex min-h-0 flex-1">
          <AdminSidebar
            pages={adminPages}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            collapsed={sidebarCollapsed}
            onToggle={toggleSidebar}
            expandedMenus={expandedMenus}
            onToggleMenu={toggleMenuExpansion}
          />

          <section className="min-h-0 flex-1 overflow-auto bg-slate-50">
            <div className="p-6">
              <Routes>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="/data-analysis" element={<DataAnalysis />} />
                <Route path="/alerts" element={<AlertManagement />} />
                <Route path="/network/device" element={<NetworkDevice />} />
                <Route path="/network/zone" element={<NetworkZone />} />
                <Route path="/network/site" element={<NetworkSite />} />
                <Route path="/system/user" element={<SystemUser />} />
                <Route path="/system/menu" element={<SystemMenu />} />
                <Route path="/system/permission" element={<SystemPermission />} />
                <Route path="/system/role" element={<SystemRole />} />
                <Route path="/system/config" element={<SystemConfig />} />
              </Routes>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
