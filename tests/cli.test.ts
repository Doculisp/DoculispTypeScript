import { exec } from 'child_process';
import path from 'path';

// Test for CLI functionality - specifically the -t flag bug
describe('CLI', () => {
    const testProjectFile = path.resolve('./documentation/doculisp.dlproj');

    function runCLI(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
        return new Promise((resolve) => {
            const command = `npx ts-node ./src/index.ts ${args.join(' ')}`;
            exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
                resolve({ 
                    stdout: stdout || '', 
                    stderr: stderr || '', 
                    exitCode: error?.code || 0 
                });
            });
        });
    }

    describe('test flag (-t)', () => {
        it('should handle .dlproj files without throwing Unknown atom errors', async () => {
            const result = await runCLI(['-t', testProjectFile]);
            
            // The test should not fail with "Unknown atom 'documents'" error
            expect(result.stderr).not.toContain('Unknown atom');
            expect(result.stderr).not.toContain('documents');
            
            // For now, we expect it to succeed (this test will fail initially - TDD red phase)
            expect(result.exitCode).toBe(0);
        }, 10000);

        it('should validate file extensions same as compile mode', async () => {
            const invalidFile = './some-invalid-file.txt';
            const result = await runCLI(['-t', invalidFile]);
            
            // Should get the same validation error as compile mode
            expect(result.stderr).toContain('source file must be either a markdown, dlisp, or a dlproj file');
            expect(result.exitCode).toBe(1);
        }, 10000);

        it('should require a source path', async () => {
            const result = await runCLI(['-t']);
            
            // Should show error about missing source path
            expect(result.stderr).toContain('--test` option requires a source path');
            expect(result.exitCode).toBe(1); // CLI should exit with error code when validation fails
        }, 10000);

        it('should output "Ok! [filename] valid." format for .dlproj files', async () => {
            const result = await runCLI(['-t', testProjectFile]);
            
            // Should show "Ok! [filename] valid." for each file in the project
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toMatch(/Ok! .* valid\./);
            
            // Should not show "successfully written" (that's for compile mode)
            expect(result.stdout).not.toContain('successfully written');
        }, 10000);
    });

    describe('compile mode comparison', () => {
        it('should handle .dlproj files successfully in normal mode', async () => {
            const result = await runCLI([testProjectFile]);
            
            // This should work (baseline test)
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('successfully written');
        }, 10000);
    });
});