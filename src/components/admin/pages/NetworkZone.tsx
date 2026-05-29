import { useState, useEffect } from 'react'
import districtsData from '../../../data/districts.json'
import { AreaFormModal, type AreaFormData } from '../forms/AreaFormModal'

const PAGE_SIZE = 10

type AreaStatus = 'normal' | 'rain-ratio-abnormal' | 'inflow-infiltration' | 'pipe-siltation'

interface District {
  id: string
  name: string
  sewageSystem: string
  status: 'healthy' | 'warning' | 'critical'
  areaType: 'normal' | 'siltation' | 'inflow'
  rainyWeatherFlow: number
  dryWeatherFlow: number
  rainRatio: number
  coordinates: number[][]
  isActive?: boolean
}

interface Area {
  id: string
  name: string
  deviceCount: number
  rainRatio: number
  status: AreaStatus
  isActive?: boolean
}

const statusLabels: Record<AreaStatus, string> = {
  normal: '正常',
  'rain-ratio-abnormal': '晴雨比异常',
  'inflow-infiltration': '流入渗入',
  'pipe-siltation': '管道淤积',
}

const statusStyles: Record<AreaStatus, string> = {
  normal: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'rain-ratio-abnormal': 'bg-blue-100 text-blue-800 border-blue-300',
  'inflow-infiltration': 'bg-amber-50 text-amber-700 border-amber-200',
  'pipe-siltation': 'bg-red-50 text-red-700 border-red-200',
}

function mapAreaStatus(areaType: District['areaType'], _status: District['status'], rainRatio: number): AreaStatus {
  if (areaType === 'siltation') return 'pipe-siltation'
  if (areaType === 'inflow') return 'inflow-infiltration'
  if (rainRatio >= 2.5) return 'rain-ratio-abnormal'
  return 'normal'
}

const mockDeviceCounts: Record<string, number> = {
  '108': 5,
  '110': 3,
  '111': 2,
  '112': 4,
  '113': 6,
  '114': 3,
  '115': 4,
  '116': 2,
  '117': 5,
}

export function NetworkZone() {
  const [areas, setAreas] = useState<Area[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDistrict, setEditingDistrict] = useState<District | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | AreaStatus>('all')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadAreas()
  }, [])

  const loadAreas = () => {
    const districtList = districtsData as District[]
    setDistricts(districtList)

    const areaList: Area[] = districtList.map((district) => ({
      id: district.id,
      name: district.name,
      deviceCount: mockDeviceCounts[district.id] || 0,
      rainRatio: district.rainRatio,
      status: mapAreaStatus(district.areaType, district.status, district.rainRatio),
      isActive: district.isActive ?? true,
    }))
    setAreas(areaList)
  }

  const handleAddArea = () => {
    setEditingDistrict(null)
    setIsModalOpen(true)
  }

  const handleEditArea = (area: Area) => {
    // 找到对应的完整 District 数据
    const district = districts.find(d => d.id === area.id)
    if (district) {
      setEditingDistrict(district)
      setIsModalOpen(true)
    }
  }

  const handleSaveArea = (data: AreaFormData) => {
    console.log('保存区域:', data)
    // TODO: 实际保存到数据源 (districts.json 或 后端API)
    // 如果是编辑，更新现有数据；如果是新增，添加新数据
    loadAreas()
    setIsModalOpen(false)
  }

  // 过滤后的数据
  const filteredAreas = areas.filter((area) => {
    const matchesSearch = area.name.toLowerCase().includes(searchKeyword.toLowerCase())
    const matchesStatus = statusFilter === 'all' || area.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // 分页数据
  const totalPages = Math.ceil(filteredAreas.length / PAGE_SIZE) || 1
  const paginatedAreas = filteredAreas.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleSearchChange = (value: string) => {
    setSearchKeyword(value)
    setCurrentPage(1)
  }

  const handleStatusFilterChange = (value: 'all' | AreaStatus) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">区域管理</h2>
        <button
          onClick={handleAddArea}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          + 新增区域
        </button>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="搜索区域名称..."
            value={searchKeyword}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value as 'all' | AreaStatus)}
          className="rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">全部状态</option>
          <option value="normal">正常</option>
          <option value="rain-ratio-abnormal">晴雨比异常</option>
          <option value="inflow-infiltration">流入渗入</option>
          <option value="pipe-siltation">管道淤积</option>
        </select>

        <div className="ml-auto text-sm text-slate-500">
          共 {filteredAreas.length} 条记录
        </div>
      </div>

      <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                区域名称
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                设备数量
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                晴雨比
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                当前状态
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                激活状态
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedAreas.map((area) => (
              <tr key={area.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm font-medium text-slate-900">{area.name}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{area.deviceCount}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{area.rainRatio.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      statusStyles[area.status]
                    }`}
                  >
                    {statusLabels[area.status]}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {area.isActive ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      已激活
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      未激活
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right text-sm">
                  <button
                    onClick={() => handleEditArea(area)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    编辑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      {/* 分页 */}
      {filteredAreas.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 disabled:hover:bg-white"
          >
            上一页
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            // 显示逻辑：首页、末页、当前页及前后各1页
            const showPage =
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1)

            if (!showPage) {
              // 显示省略号
              if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <span key={page} className="px-2 text-slate-400">
                    ...
                  </span>
                )
              }
              return null
            }

            return (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`min-w-[36px] rounded-lg px-3 py-2 text-sm ${
                  currentPage === page
                    ? 'border border-blue-500 bg-blue-500 font-medium text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            )
          })}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 disabled:hover:bg-white"
          >
            下一页
          </button>
        </div>
      )}

      {filteredAreas.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          {searchKeyword || statusFilter !== 'all' ? '未找到匹配的数据' : '暂无区域数据'}
        </div>
      )}

      {/* 新增/编辑弹窗 */}
      <AreaFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveArea}
        editData={editingDistrict ? ({
          id: editingDistrict.id,
          name: editingDistrict.name,
          sewageSystem: editingDistrict.sewageSystem as any,
          deviceIds: [],
          coordinates: editingDistrict.coordinates as any,
          isActive: editingDistrict.isActive ?? true,
        }) : null}
      />
    </div>
  )
}
