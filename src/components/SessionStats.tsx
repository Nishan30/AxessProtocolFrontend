import { FC } from 'react';

interface GpuStats {
    gpu_utilization_percent: number;
    memory_used_mb: number;
    memory_total_mb: number;
}

interface SessionStatsProps {
    stats: GpuStats | null;
}

const SessionStats: FC<SessionStatsProps> = ({ stats }) => {
    if (!stats) {
        return <div className="text-sm text-gray-400 mt-4">Waiting for first stats update...</div>;
    }

    const memoryUsagePercent = (stats.memory_used_mb / stats.memory_total_mb) * 100;

    return (
        <div className="mt-4 space-y-3 text-sm">
            <div>
                <div className="flex justify-between font-mono">
                    <span>GPU Utilization</span>
                    <span>{stats.gpu_utilization_percent}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${stats.gpu_utilization_percent}%` }}></div>
                </div>
            </div>
            <div>
                <div className="flex justify-between font-mono">
                    <span>VRAM</span>
                    <span>{stats.memory_used_mb}MB / {stats.memory_total_mb}MB</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
                    <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${memoryUsagePercent}%` }}></div>
                </div>
            </div>
        </div>
    );
};

export default SessionStats;