import type { FC } from "react"
import { Activity, HardDrive } from "lucide-react"

interface GpuStats {
  gpu_utilization_percent: number
  memory_used_mb: number
  memory_total_mb: number
}

interface SessionStatsProps {
  stats: GpuStats | null
}

export const SessionStats: FC<SessionStatsProps> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="mt-4 p-4 rounded-lg bg-muted/30 text-center">
        <p className="text-sm text-muted-foreground">Waiting for first stats update...</p>
      </div>
    )
  }

  const memoryUsagePercent = (stats.memory_used_mb / stats.memory_total_mb) * 100

  return (
    <div className="mt-6 space-y-4">
      <div className="p-4 rounded-lg bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-success" />
            <span className="text-sm font-medium">GPU Utilization</span>
          </div>
          <span className="font-mono text-sm font-semibold">{stats.gpu_utilization_percent}%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-success to-success/70 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${stats.gpu_utilization_percent}%` }}
          />
        </div>
      </div>

      <div className="p-4 rounded-lg bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium">VRAM Usage</span>
          </div>
          <span className="font-mono text-sm font-semibold">
            {stats.memory_used_mb}MB / {stats.memory_total_mb}MB
          </span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-accent to-accent/70 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${memoryUsagePercent}%` }}
          />
        </div>
      </div>
    </div>
  )
}
