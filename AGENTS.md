# AGENTS.md

## 项目定位

本项目是“排水管网运行智能分析平台”，用于智慧水务投标演示。实现形态为轻数字孪生 GIS 大屏，所有核心功能集中在一个可演示的大屏页面内。

后续开发统一按 React + Vite + TypeScript 推进。历史 Vue 相关内容已废弃，不再作为实现依据。

## 技术栈

- React
- Vite
- TypeScript
- Tailwind CSS
- MapLibre GL JS
- ECharts
- 静态 Mock 数据

## 功能范围

重点围绕排水管网运行分析展示：

- 雨污混接分析
- 晴雨比分析
- 管道淤积分析
- 流入渗入分析

页面应服务于投标演示，不做后端接入假设。数据默认来自本地 Mock 文件。

## 页面结构

大屏首屏应以 GIS 地图作为主视觉，周边组织分析信息：

- 顶部标题和核心 KPI
- 中央 GIS 地图、管线、站点、区域和告警状态
- 左右两侧图表面板
- 底部告警或事件滚动区域

不要把页面做成营销落地页。第一屏应直接呈现可演示的大屏应用界面。

## 开发约束

- 使用 React 函数组件和 Hooks。
- 禁止使用 `any`。
- 单个组件建议不超过 300 行。
- 页面组件只负责布局、数据组合和状态编排。
- 复杂逻辑拆到 hooks、utils 或独立模块。
- MapLibre 初始化、图层、事件和动画逻辑必须封装，避免堆在页面组件中。
- ECharts 大型配置拆成独立函数或配置模块。
- Mock 数据独立存放，页面组件只消费结构化数据。
- 样式优先使用 Tailwind CSS，避免超长内联样式。

## UI 约定

- 整体风格为轻数字孪生水务 GIS 大屏。
- 面板可使用半透明背景、细边框和适度阴影，但不要堆叠过多装饰。
- 异常状态应有清晰视觉反馈，例如闪烁、强调色或状态标签。
- 管线可表现水流方向动画。
- 分析区域可使用高亮或边界描边表达选中、异常和风险状态。
- 图表、地图标注、KPI 和告警信息要保持可读，避免互相遮挡。

## 命名示例

- `MapPipeLayer.tsx`
- `AlarmPanel.tsx`
- `KpiHeader.tsx`
- `useMapLayers.ts`
- `useDrainageAlarms.ts`
- `mockDrainageData.ts`
- `buildRainSewageChartOptions.ts`

## 验证命令

提交或交付前优先运行：

```bash
npm run lint
npm run build
```

如果验证无法运行，需要在交付说明中写明原因。
