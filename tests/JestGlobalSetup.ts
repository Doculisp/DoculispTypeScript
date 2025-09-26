import { initializeGlobalsForJest } from "approvals/lib/Providers/Jest/JestSetup";
import { LogUtils } from "approvals/lib/Logs/LogUtils";
import * as path from "path";
import * as fs from "fs";

export default async function globalSetup(): Promise<void> {
    return new Promise<void>((resolve) => {
        // Delete all log files to ensure fresh timestamps and prevent warnings
        const tempDir = LogUtils.ensureTempDirectoryExists();
        const logFiles = [
            ".approved_files.log",
            ".failed_comparison.log"
        ];
        
        logFiles.forEach(logFile => {
            const logFilePath = path.join(tempDir, logFile);
            try {
                if (fs.existsSync(logFilePath)) {
                    fs.unlinkSync(logFilePath);
                }
            } catch (error) {
                // Ignore errors - file might not exist or be locked
            }
        });
        
        initializeGlobalsForJest();
        resolve();
    });
}