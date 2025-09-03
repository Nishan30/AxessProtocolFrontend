import { create } from 'zustand';

// Define the type for the account info, same as in your pages
interface AccountInfo {
  address: string;
  publicKey: string;
}

// Define the state and actions for our store
interface WalletState {
  account: AccountInfo | null;
  setAccount: (account: AccountInfo | null) => void;
}

// Create the store
export const useWalletStore = create<WalletState>((set) => ({
  account: null,
  setAccount: (account) => set({ account }),
}));