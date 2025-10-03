import type { FC } from "react"
import { DollarSign, Clock } from "lucide-react"

interface BillingMetricsProps {
  price_per_second?: number
  uptime_seconds?: number
  current_cost_octas?: number
}

export const BillingMetrics: FC<BillingMetricsProps> = ({
  price_per_second = 0,
  uptime_seconds = 0,
  current_cost_octas = 0,
}) => {
  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0")
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0")
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0")
    return `${h}:${m}:${s}`
  }

  const formatCost = (octas: number) => {
    return (octas / 100_000_000).toFixed(6)
  }

  return (
    <div className="mt-6 pt-6 border-t border-border/50 space-y-4">
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
        <div className="flex items-center gap-2 text-muted-foreground">
          <DollarSign className="h-4 w-4" />
          <span className="text-sm font-medium">Rate</span>
        </div>
        <span className="font-mono text-sm font-semibold">{price_per_second} Octas/sec</span>
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">Uptime</span>
        </div>
        <span className="font-mono text-sm font-semibold">{formatUptime(uptime_seconds)}</span>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
        <span className="text-sm font-medium text-muted-foreground">Current Cost</span>
        <div className="text-right">
          <div className="font-mono text-2xl font-bold text-primary">{formatCost(current_cost_octas)} APT</div>
          <div className="text-xs text-muted-foreground font-mono">{current_cost_octas.toLocaleString()} Octas</div>
        </div>
      </div>
    </div>
  )
}
