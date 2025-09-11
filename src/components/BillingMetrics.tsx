import { FC } from 'react';

interface BillingMetricsProps {
    price_per_second?: number;
    uptime_seconds?: number;
    current_cost_octas?: number;
}

const BillingMetrics: FC<BillingMetricsProps> = ({ price_per_second = 0, uptime_seconds = 0, current_cost_octas = 0 }) => {
    
    // Helper to format seconds into HH:MM:SS
    const formatUptime = (seconds: number) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    // Helper to convert Octas to APT (1 APT = 10^8 Octas)
    const formatCost = (octas: number) => {
        return (octas / 100_000_000).toFixed(6); // Show 6 decimal places for APT
    };

    return (
        <div className="mt-4 pt-4 border-t border-gray-700 text-sm space-y-2">
            <div className="flex justify-between items-center font-mono">
                <span className="text-gray-400">Rate:</span>
                <span>{price_per_second} Octas/sec</span>
            </div>
            <div className="flex justify-between items-center font-mono">
                <span className="text-gray-400">Uptime:</span>
                <span>{formatUptime(uptime_seconds)}</span>
            </div>
            <div className="flex justify-between items-center font-mono text-lg">
                <span className="text-gray-400">Current Cost:</span>
                <span className="font-bold text-cyan-400">{formatCost(current_cost_octas)} APT</span>
            </div>
        </div>
    );
};

export default BillingMetrics;