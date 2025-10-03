"use client"

import type { FC } from "react"
import { CheckCircle2, XCircle, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface TransactionState {
  status: "idle" | "processing" | "success" | "error"
  hash?: string
  message?: string
}

interface TransactionStatusProps {
  state: TransactionState
  onClear: () => void
}

export const TransactionStatus: FC<TransactionStatusProps> = ({ state, onClear }) => {
  if (state.status === "idle") {
    return null
  }

  const explorerUrl = `https://explorer.aptoslabs.com/txn/${state.hash}?network=testnet`

  return (
    <div className="mb-6 animate-fade-in">
      {state.status === "processing" && (
        <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-accent animate-spin" />
            <div>
              <p className="font-semibold text-accent">Transaction Processing</p>
              <p className="text-sm text-muted-foreground">Please wait while your transaction is confirmed...</p>
            </div>
          </div>
        </div>
      )}

      {state.status === "success" && (
        <div className="p-4 rounded-lg bg-success/10 border border-success/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <div>
              <p className="font-semibold text-success">Transaction Successful!</p>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent hover:underline"
              >
                View on Aptos Explorer →
              </a>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {state.status === "error" && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <XCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">Transaction Failed</p>
              <p className="text-sm text-muted-foreground">{state.message || "An error occurred"}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
