import { useState, useRef, useEffect, useCallback } from 'react'
import { monitoringSites } from '../../../data/monitoringSiteData'
import type { DrainageMapPoint } from '../../../types/drainage'

// 天地图类型声明
declare global {
  interface Window {
    T?: any
  }
}

interface SiteOption {
  id: string
  name: string
  category: string
  coordinate: [number, number]
  normalIconUrl: string | undefined
  alarmIconUrl: string | undefined
  status: 'healthy' | 'warning' | 'critical'
}

interface AreaFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: AreaFormData) => void
  editData?: AreaFormData | null
}

export interface AreaFormData {
  id?: string
  name: string
  sewageSystem: 'SEPARATE_SYSTEM' | 'COMBINED_SYSTEM'
  deviceIds: string[]
  coordinates: [number, number][]
  isActive?: boolean
}

const sewageSystems = [
  { value: 'SEPARATE_SYSTEM', label: '分流制系统' },
  { value: 'COMBINED_SYSTEM', label: '合流制系统' },
]

const TDT_TOKEN = '5ce9baeca773fde9739ec866f9e117f3'

// 站点类型标签映射
const siteTypeLabels: Record<string, string> = {
  'rain-well': '雨水井',
  'sewage-well': '污水井',
  'outfall': '排水口',
  'pump-station': '泵站',
  'water-meter': '水表',
}

export function AreaFormModal({ isOpen, onClose, onSave, editData }: AreaFormModalProps) {
  const [formData, setFormData] = useState<AreaFormData>({
    name: '',
    sewageSystem: 'SEPARATE_SYSTEM',
    deviceIds: [],
    coordinates: [],
    isActive: true,
  })

  const [showMap, setShowMap] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [isSiteListCollapsed, setIsSiteListCollapsed] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const drawingPointsRef = useRef<[number, number][]>([])
  const polygonLayerRef = useRef<any>(null)
  const drawingMarkersRef = useRef<any[]>([])
  const previewLinesRef = useRef<any[]>([])
  const siteMarkersRef = useRef<any[]>([])

  // 使用站点数据
  const siteOptions: SiteOption[] = monitoringSites.map((site: DrainageMapPoint) => ({
    id: site.id,
    name: site.name,
    category: site.category,
    coordinate: site.coordinate,
    normalIconUrl: site.normalIconUrl,
    alarmIconUrl: site.alarmIconUrl,
    status: site.status,
  }))

  // 清除天地图相关cookie以避免冲突
  const clearTiandituCookies = useCallback(() => {
    const domains = ['tianditu.gov.cn', 'api.tianditu.gov.cn', '.tianditu.gov.cn']
    const cookieNames = ['TDTSESID', 'tdtsesid']

    cookieNames.forEach((name) => {
      // 尝试清除所有可能的domain/path组合
      domains.forEach((domain) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}; secure`
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      })
    })
  }, [])

  // 加载天地图脚本
  useEffect(() => {
    if (window.T) {
      setMapLoaded(true)
      return
    }

    // 清除可能冲突的cookie
    clearTiandituCookies()

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = `https://api.tianditu.gov.cn/api?v=4.0&tk=${TDT_TOKEN}`
    script.charset = 'utf-8'
    script.crossOrigin = 'anonymous'

    script.onload = () => {
      setMapLoaded(true)
    }

    script.onerror = () => {
      console.error('[天地图] 脚本加载失败，可能存在cookie冲突或网络问题')
      // 尝试清除cookie后重新加载
      clearTiandituCookies()
    }

    document.head.appendChild(script)

    return () => {
      // 清理脚本
      const existingScript = document.querySelector(`script[src*="api.tianditu.gov.cn"]`)
      if (existingScript && existingScript !== script) {
        existingScript.remove()
      }
    }
  }, [clearTiandituCookies])


  // 初始化地图
  useEffect(() => {
    if (!showMap || !mapRef.current || !mapLoaded || !window.T) return

    // 避免重复初始化
    if (mapInstanceRef.current) {
      return
    }

    const T = window.T

    // 创建地图
    const map = new T.Map(mapRef.current, {
      center: new T.LngLat(118.55, 29.43),
      zoom: 15,
      minZoom: 12,
      maxZoom: 18,
    })

    // 添加缩放控件
    const zoomControl = new T.Control.Zoom()
    map.addControl(zoomControl)

    // 添加地图类型控件
    const mapTypeControl = new T.Control.MapType()
    map.addControl(mapTypeControl)

    mapInstanceRef.current = map

    // 添加站点标记点（仅显示，不可点击）
    siteOptions.forEach((site) => {
      const iconUrl = site.status === 'critical' ? site.alarmIconUrl : site.normalIconUrl
      if (!iconUrl) return // Skip sites without icon URLs

      const point = new T.LngLat(site.coordinate[0], site.coordinate[1])
      const marker = new T.Marker(point, {
        icon: new T.Icon({
          iconUrl,
          iconSize: new T.Point(32, 32),
          iconAnchor: new T.Point(16, 16),
        }),
      })

      // 站点标记不可点击，防止影响图形绘制
      // 不添加点击事件，让点击事件直接传递到地图

      map.addOverLay(marker)
      siteMarkersRef.current.push(marker)
    })

    // 地图点击事件
    map.addEventListener('click', (e: any) => {
      if (!e.lnglat) return

      const lnglat = e.lnglat
      const point: [number, number] = [lnglat.getLng(), lnglat.getLat()]
      drawingPointsRef.current.push(point)

      updatePolygon(map)
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null
      }
    }
  }, [showMap, mapLoaded, siteOptions])

  const updatePolygon = useCallback((map: any) => {
    if (!map) return

    const T = window.T
    const points = drawingPointsRef.current

    // 清除旧的绘制点、预览线和多边形
    drawingMarkersRef.current.forEach((marker) => map.removeOverLay(marker))
    drawingMarkersRef.current = []
    previewLinesRef.current.forEach((line) => map.removeOverLay(line))
    previewLinesRef.current = []
    if (polygonLayerRef.current) {
      map.removeOverLay(polygonLayerRef)
      polygonLayerRef.current = null
    }

    // 绘制点击的点（使用自定义绘制点图标）
    points.forEach((point) => {
      const lnglat = new T.LngLat(point[0], point[1])
      const marker = new T.Marker(lnglat, {
        icon: new T.Icon({
          iconUrl: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="8" r="6" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>
            </svg>
          `),
          iconSize: new T.Point(16, 16),
          iconAnchor: new T.Point(8, 8),
        }),
      })
      map.addOverLay(marker)
      drawingMarkersRef.current.push(marker)
    })

    // 绘制预览线（点之间的连线）
    if (points.length >= 2) {
      for (let i = 0; i < points.length - 1; i++) {
        const start = new T.LngLat(points[i][0], points[i][1])
        const end = new T.LngLat(points[i + 1][0], points[i + 1][1])
        const line = new T.Polyline([start, end], {
          color: '#3b82f6',
          weight: 2,
          opacity: 0.8,
        })
        map.addOverLay(line)
        previewLinesRef.current.push(line)
      }

      // 如果有3个或更多点，闭合最后一点和第一点之间的线
      if (points.length >= 3) {
        const last = new T.LngLat(points[points.length - 1][0], points[points.length - 1][1])
        const first = new T.LngLat(points[0][0], points[0][1])
        const closeLine = new T.Polyline([last, first], {
          color: '#3b82f6',
          weight: 2,
          opacity: 0.8,
        })
        map.addOverLay(closeLine)
        previewLinesRef.current.push(closeLine)
      }
    }
  }, [])

  useEffect(() => {
    if (editData) {
      setFormData({
        ...editData,
        isActive: editData.isActive ?? true,
      })
      drawingPointsRef.current = editData.coordinates || []
      previewLinesRef.current = []
      setIsSiteListCollapsed(false)
    } else {
      setFormData({
        name: '',
        sewageSystem: 'SEPARATE_SYSTEM',
        deviceIds: [],
        coordinates: [],
        isActive: true,
      })
      drawingPointsRef.current = []
      previewLinesRef.current = []
      setIsSiteListCollapsed(false)
    }
  }, [editData, isOpen])

  const handleDeviceToggle = (siteId: string) => {
    setFormData((prev) => {
      const newDeviceIds = prev.deviceIds.includes(siteId)
        ? prev.deviceIds.filter((id) => id !== siteId)
        : [...prev.deviceIds, siteId]
      return { ...prev, deviceIds: newDeviceIds }
    })
  }

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('请输入区域名称')
      return
    }

    if (drawingPointsRef.current.length < 3) {
      alert('请在地图上绘制至少3个点形成区域')
      return
    }

    onSave({
      ...formData,
      coordinates: drawingPointsRef.current,
    })
  }

  const handleClearDrawing = () => {
    if (mapInstanceRef.current) {
      // 清除所有绘制点标记
      drawingMarkersRef.current.forEach((marker) => mapInstanceRef.current.removeOverLay(marker))
      drawingMarkersRef.current = []

      // 清除所有预览线
      previewLinesRef.current.forEach((line) => mapInstanceRef.current.removeOverLay(line))
      previewLinesRef.current = []

      // 清除多边形
      if (polygonLayerRef.current) {
        mapInstanceRef.current.removeOverLay(polygonLayerRef.current)
        polygonLayerRef.current = null
      }
    }
    // 清空绘制点数据
    drawingPointsRef.current = []
  }

  const handleStartDrawing = () => {
    setShowMap(true)
    setIsSiteListCollapsed(true)
  }

  const handleCancelDrawing = () => {
    setShowMap(false)
    setIsSiteListCollapsed(false)
    handleClearDrawing()
  }

  const handleClose = () => {
    setFormData({
      name: '',
      sewageSystem: 'SEPARATE_SYSTEM',
      deviceIds: [],
      coordinates: [],
      isActive: true,
    })
    drawingPointsRef.current = []
    previewLinesRef.current = []
    setShowMap(false)
    setIsSiteListCollapsed(false)
    // 重置地图实例以便下次重新初始化
    mapInstanceRef.current = null
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg bg-white shadow-xl">
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {editData ? '编辑区域' : '新增区域'}
          </h3>
          <button
            onClick={handleClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-slate-900">基本信息</h4>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  区域名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入区域名称"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  污水系统类型
                </label>
                <select
                  value={formData.sewageSystem}
                  onChange={(e) => setFormData({ ...formData, sewageSystem: e.target.value as any })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {sewageSystems.map((sys) => (
                    <option key={sys.value} value={sys.value}>
                      {sys.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  是否激活
                </label>
                <div className="flex items-center h-9">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.isActive ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.isActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="ml-2 text-sm text-slate-600">
                    {formData.isActive ? '已激活' : '未激活'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {formData.isActive ? '该区域将显示在大屏可视化中' : '该区域不会显示在大屏可视化中'}
                </p>
              </div>
            </div>
          </div>

          {/* 站点选择 */}
          {!isSiteListCollapsed && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-slate-900">
                关联站点 <span className="text-slate-400 font-normal">（已选择 {formData.deviceIds.length} 个）</span>
              </h4>

              <div className="max-h-48 overflow-auto rounded-lg border border-slate-200">
                <table className="w-full">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">选择</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">站点名称</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">类型</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {siteOptions.map((site) => (
                      <tr key={site.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={formData.deviceIds.includes(site.id)}
                            onChange={() => handleDeviceToggle(site.id)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-2 text-sm text-slate-900">{site.name}</td>
                        <td className="px-4 py-2 text-sm text-slate-500">
                          {siteTypeLabels[site.category] || site.category}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {site.status === 'critical' ? (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                              异常
                            </span>
                          ) : site.status === 'warning' ? (
                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                              警告
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                              正常
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 绘制时显示折叠提示 */}
          {isSiteListCollapsed && (
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>已选择 {formData.deviceIds.length} 个关联站点，取消绘制后可查看</span>
              </div>
            </div>
          )}

          {/* 区域绘制 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-slate-900">
                  区域绘制
                </h4>
                {!showMap && (
                  <p className="text-xs text-slate-500 mt-1">
                    在地图上点击添加点，至少3个点形成区域多边形
                  </p>
                )}
              </div>
              {!showMap ? (
                <button
                  onClick={handleStartDrawing}
                  disabled={!mapLoaded}
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  开始绘制
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleClearDrawing}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    清除
                  </button>
                  <button
                    onClick={handleCancelDrawing}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    取消绘制
                  </button>
                </div>
              )}
            </div>

            {showMap && (
              <div className="relative">
                <div ref={mapRef} className="h-96 w-full rounded-lg border border-slate-200" />
                {!mapLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-100">
                    <div className="text-sm text-slate-500">正在加载地图...</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 底部 */}
        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            onClick={handleClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
