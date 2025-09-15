import { FC } from 'react';

// Define the shape of the state this component will receive
export interface TransactionState {
    status: 'idle' | 'processing' | 'success' | 'error';
    hash?: string;
    message?: string;
}

interface TransactionStatusProps {
    state: TransactionState;
    onClear: () => void;
}

const TransactionStatus: FC<TransactionStatusProps> = ({ state, onClear }) => {
    if (state.status === 'idle') {
        return null;
    }

    const baseClasses = "p-4 rounded-lg text-white mb-4 text-center";
    const statusClasses = {
        processing: "bg-blue-500/30 border border-blue-400",
        success: "bg-green-500/30 border border-green-400",
        error: "bg-red-500/30 border border-red-400",
    };

    const explorerUrl = `https://explorer.aptoslabs.com/txn/${state.hash}?network=testnet`;

    return (
        <div className={`${baseClasses} ${statusClasses[state.status]}`}>
            {state.status === 'processing' && (
                <p>Transaction is processing... Please wait.</p>
            )}
            {state.status === 'success' && (
                <div>
                    <p className="font-bold">✅ Transaction Successful!</p>
                    <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                        View on Aptos Explorer
                    </a>
                </div>
            )}
            {state.status === 'error' && (
                <div>
                    <p className="font-bold">❌ Transaction Failed</p>
                    <p className="text-xs mt-1">{state.message}</p>
                </div>
            )}
             <button onClick={onClear} className="text-xs text-gray-400 hover:text-white mt-2">[close]</button>
        </div>
    );
};

export default TransactionStatus;