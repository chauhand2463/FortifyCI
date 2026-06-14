export interface EmailOptions {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    cc?: string | string[];
    bcc?: string | string[];
    attachments?: Array<{
        filename: string;
        content?: Buffer | string;
        path?: string;
        contentType?: string;
    }>;
}
export declare function sendEmail(options: EmailOptions): Promise<boolean>;
export declare function sendScanCompletedEmail(to: string, scanId: string, imageRef: string, summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
}): Promise<boolean>;
export declare function sendVulnerabilityAlertEmail(to: string, imageRef: string, vulnerabilityId: string, severity: string, packageName: string): Promise<boolean>;
//# sourceMappingURL=email.d.ts.map