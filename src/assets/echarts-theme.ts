import * as echarts from 'echarts'

// Light theme — transparent background, clean grid
echarts.registerTheme('custom-light', {
  backgroundColor: 'transparent',
  color: [
    '#6366f1', '#22d3ee', '#34d399', '#fb923c',
    '#fb7185', '#a78bfa', '#38bdf8', '#fbbf24',
  ],
  textStyle: { color: '#475569' },
  legend: { textStyle: { color: '#475569' } },
  title: { textStyle: { color: '#1a1f36' } },
  xAxis: {
    axisLine: { lineStyle: { color: '#dce1eb' } },
    axisLabel: { color: '#7a839c' },
    splitLine: { show: false },
  },
  yAxis: {
    axisLine: { lineStyle: { color: '#dce1eb' } },
    axisLabel: { color: '#7a839c' },
    splitLine: {
      lineStyle: { color: '#eef1f7', type: 'dashed' },
    },
  },
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderColor: '#cbd5e1',
    textStyle: { color: '#1e293b' },
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  },
})

// Dark theme — transparent background, matches dark card
echarts.registerTheme('custom-dark', {
  backgroundColor: 'transparent',
  color: [
    '#818cf8', '#22d3ee', '#34d399', '#fb923c',
    '#fb7185', '#c4b5fd', '#38bdf8', '#fde68a',
  ],
  textStyle: { color: '#c8d2e0' },
  legend: { textStyle: { color: '#c8d2e0' } },
  title: { textStyle: { color: '#e4e8f5' } },
  xAxis: {
    axisLine: { lineStyle: { color: '#2e3a5c' } },
    axisLabel: { color: '#8899b4' },
    splitLine: { show: false },
  },
  yAxis: {
    axisLine: { lineStyle: { color: '#2e3a5c' } },
    axisLabel: { color: '#8899b4' },
    splitLine: {
      lineStyle: { color: '#1e2a4a', type: 'dashed' },
    },
  },
  tooltip: {
    backgroundColor: 'rgba(20, 24, 49, 0.96)',
    borderColor: '#818cf8',
    textStyle: { color: '#e4e8f5' },
    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
  },
})
