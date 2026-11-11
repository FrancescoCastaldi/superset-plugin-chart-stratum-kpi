/**
 * Time and duration values.
 *
 * A metric of type Time (SQL Server `time`, an average waiting time) reaches the card as text such as
 * "00:12:54.425000". The card works on seconds and writes them back as a duration.
 */
export type TimeDisplayFormat = 'auto' | 'hms' | 'ms' | 'minutes' | 'hours' | 'seconds';
export interface TimeFormatOptions {
    format?: TimeDisplayFormat;
    /** Decimals of the seconds in clock formats and of the value in decimal formats */
    fractionDigits?: number;
    /** Largest value of the card in seconds: the automatic format shows hours when it reaches one */
    referenceSeconds?: number;
}
/**
 * Seconds of a time or duration written as text, or null when the text is not one.
 * Accepted: `HH:MM:SS`, `H:MM:SS.ffffff`, `26:10:00` (more than 24 hours), `1 day, 2:03:04`,
 * `0 days 00:12:54.425000` and ISO 8601 durations (`PT12M54S`). Two-part values such as `12:54` are not
 * accepted: they could be hours and minutes or minutes and seconds.
 */
export declare function parseTimeToSeconds(raw: unknown): number | null;
/** Text of a number of seconds in the chosen display format */
export declare function formatDuration(seconds: number, options?: TimeFormatOptions): string;
/** Difference between two durations: always with its sign, `+05:00` or `-00:30` */
export declare function formatSignedDuration(seconds: number, options?: TimeFormatOptions): string;
//# sourceMappingURL=timeValues.d.ts.map