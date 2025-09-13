export declare function getDailyPageViews(): Promise<{
    totalViews: number;
    prevDayViewsChangePercent: string;
}>;
export declare function getSources(): Promise<never[] | [{
    source: string;
    visitors: number;
}]>;
//# sourceMappingURL=plausibleAnalyticsUtils.d.ts.map