import { z } from 'zod';
export declare const createReportSchema: z.ZodObject<{
    title: z.ZodString;
    format: z.ZodDefault<z.ZodEnum<["PDF", "CSV", "JSON"]>>;
    scanId: z.ZodOptional<z.ZodString>;
    imageId: z.ZodOptional<z.ZodString>;
    parameters: z.ZodOptional<z.ZodObject<{
        includeVulnerabilities: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeSbom: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        severityFilter: z.ZodOptional<z.ZodArray<z.ZodEnum<["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN"]>, "many">>;
        dateRange: z.ZodOptional<z.ZodObject<{
            start: z.ZodOptional<z.ZodString>;
            end: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            end?: string | undefined;
            start?: string | undefined;
        }, {
            end?: string | undefined;
            start?: string | undefined;
        }>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        includeVulnerabilities: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeSbom: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        severityFilter: z.ZodOptional<z.ZodArray<z.ZodEnum<["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN"]>, "many">>;
        dateRange: z.ZodOptional<z.ZodObject<{
            start: z.ZodOptional<z.ZodString>;
            end: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            end?: string | undefined;
            start?: string | undefined;
        }, {
            end?: string | undefined;
            start?: string | undefined;
        }>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        includeVulnerabilities: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeSbom: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        severityFilter: z.ZodOptional<z.ZodArray<z.ZodEnum<["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN"]>, "many">>;
        dateRange: z.ZodOptional<z.ZodObject<{
            start: z.ZodOptional<z.ZodString>;
            end: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            end?: string | undefined;
            start?: string | undefined;
        }, {
            end?: string | undefined;
            start?: string | undefined;
        }>>;
    }, z.ZodTypeAny, "passthrough">>>;
}, "strip", z.ZodTypeAny, {
    format: "PDF" | "CSV" | "JSON";
    title: string;
    scanId?: string | undefined;
    imageId?: string | undefined;
    parameters?: z.objectOutputType<{
        includeVulnerabilities: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeSbom: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        severityFilter: z.ZodOptional<z.ZodArray<z.ZodEnum<["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN"]>, "many">>;
        dateRange: z.ZodOptional<z.ZodObject<{
            start: z.ZodOptional<z.ZodString>;
            end: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            end?: string | undefined;
            start?: string | undefined;
        }, {
            end?: string | undefined;
            start?: string | undefined;
        }>>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
}, {
    title: string;
    scanId?: string | undefined;
    format?: "PDF" | "CSV" | "JSON" | undefined;
    imageId?: string | undefined;
    parameters?: z.objectInputType<{
        includeVulnerabilities: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeSbom: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        severityFilter: z.ZodOptional<z.ZodArray<z.ZodEnum<["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN"]>, "many">>;
        dateRange: z.ZodOptional<z.ZodObject<{
            start: z.ZodOptional<z.ZodString>;
            end: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            end?: string | undefined;
            start?: string | undefined;
        }, {
            end?: string | undefined;
            start?: string | undefined;
        }>>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
}>;
export declare const reportQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    format: z.ZodOptional<z.ZodEnum<["PDF", "CSV", "JSON"]>>;
    status: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    status?: string | undefined;
    format?: "PDF" | "CSV" | "JSON" | undefined;
}, {
    status?: string | undefined;
    format?: "PDF" | "CSV" | "JSON" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}>;
export type CreateReportDto = z.infer<typeof createReportSchema>;
export type ReportQueryDto = z.infer<typeof reportQuerySchema>;
export interface ReportResponse {
    id: string;
    title: string;
    format: string;
    status: string;
    parameters: Record<string, unknown> | null;
    filePath: string | null;
    fileSize: number | null;
    generatedAt: Date | null;
    scanId: string | null;
    imageId: string | null;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface PaginatedReports {
    items: ReportResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
//# sourceMappingURL=report.types.d.ts.map