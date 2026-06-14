'use client'

import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area,
} from 'recharts'
import { severityColor } from '@/lib/utils'

const tooltipStyle = {
  background: '#0D1022',
  border: '1px solid #1C2150',
  borderRadius: '8px',
  color: '#EEF0F7',
  fontSize: '12px',
  outline: 'none',
}

export function SeverityDonutChart({
  data,
}: {
  data: { name: string; value: number; color: string }[]
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-[#5A6380]">
        No severity data
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={65}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map(entry => (
            <Cell key={entry.name} fill={severityColor(entry.name.toLowerCase())} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function ScanTrendChart({
  data,
}: {
  data: { date: string; scans: number; vulnerabilities: number }[]
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-[#5A6380]">
        No scan data
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1C2150" />
        <XAxis dataKey="date" tick={{ fill: '#5A6380', fontSize: 12 }} axisLine={{ stroke: '#1C2150' }} tickLine={false} />
        <YAxis tick={{ fill: '#5A6380', fontSize: 12 }} axisLine={{ stroke: '#1C2150' }} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="vulnerabilities" fill="#FFA502" radius={[4, 4, 0, 0]} />
        <Bar dataKey="scans" fill="#00D4AA" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function PostureChart({
  data,
}: {
  data: { date: string; score: number }[]
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-[#5A6380]">
        No posture data
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00D4AA" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#00D4AA" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1C2150" />
        <XAxis dataKey="date" tick={{ fill: '#5A6380', fontSize: 12 }} axisLine={{ stroke: '#1C2150' }} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fill: '#5A6380', fontSize: 12 }} axisLine={{ stroke: '#1C2150' }} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="score" stroke="#00D4AA" fill="url(#scoreGrad)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
