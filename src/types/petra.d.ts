export { };

declare global {
    interface PetraAccount {
        address: string;
        publicKey: string;
        // add other fields if you need them later
    }

    interface Window {
        // Petra wallet adapter injected into the window by the Petra extension
        petra?: {
            connect: () => Promise<PetraAccount>;
            disconnect?: () => Promise<void>;
            // allow any additional methods the extension may expose
            [key: string]: unknown;
        };
    }
}
