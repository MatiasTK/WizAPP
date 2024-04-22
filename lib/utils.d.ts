export declare const sleep: (ms: number) => Promise<void>;
export declare const getRandomMac: () => string;
export declare const hexToRgb: (hex: `#${string}`) => Error | {
    r: number;
    g: number;
    b: number;
};
export declare const ipAddress: (networkInterface?: string) => string | undefined;
export type Expand<T> = T extends infer O ? {
    [K in keyof O]: O[K];
} : never;
