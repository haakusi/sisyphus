/**
 * AST-Grep Engine
 *
 * Provides structural code search and transformation using AST patterns.
 * Uses ast-grep CLI for pattern matching and can perform safe refactoring.
 *
 * Supported languages:
 * - TypeScript/JavaScript
 * - Python
 * - Go
 * - Rust
 * - And more via ast-grep language support
 */
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
// Language detection mapping
const LANGUAGE_EXTENSIONS = {
    typescript: ['.ts', '.tsx', '.mts', '.cts'],
    javascript: ['.js', '.jsx', '.mjs', '.cjs'],
    python: ['.py', '.pyi'],
    go: ['.go'],
    rust: ['.rs'],
    c: ['.c', '.h'],
    cpp: ['.cpp', '.cc', '.cxx', '.hpp', '.hh', '.hxx'],
    java: ['.java'],
    kotlin: ['.kt', '.kts'],
    swift: ['.swift'],
    ruby: ['.rb'],
    css: ['.css'],
    html: ['.html', '.htm'],
    json: ['.json'],
    yaml: ['.yaml', '.yml'],
};
// ============================================
// AST-Grep Engine
// ============================================
export class ASTGrepEngine {
    astGrepPath;
    tempDir;
    constructor(astGrepPath = 'sg') {
        this.astGrepPath = this.resolveAstGrepPath(astGrepPath);
        this.tempDir = path.join(os.tmpdir(), 'ast-grep-sisyphus');
        this.ensureTempDir();
    }
    /**
     * Resolve the actual ast-grep executable path
     * On Windows, we need to find sg.exe to avoid shell script wrapper issues
     */
    resolveAstGrepPath(defaultPath) {
        if (process.platform !== 'win32') {
            return defaultPath;
        }
        // Try common locations for sg.exe
        const possiblePaths = [
            // Global npm installation
            path.join(process.env.APPDATA || '', 'npm', 'node_modules', '@ast-grep', 'cli', 'sg.exe'),
            // nvm4w installation
            path.join(process.env.NVM_SYMLINK || 'C:\\nvm4w\\nodejs', 'node_modules', '@ast-grep', 'cli', 'sg.exe'),
            // Local node_modules
            path.join(process.cwd(), 'node_modules', '@ast-grep', 'cli', 'sg.exe'),
        ];
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                return p;
            }
        }
        // Fallback to default - will use PATH lookup
        return defaultPath;
    }
    ensureTempDir() {
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }
    // ============================================
    // Core Search Methods
    // ============================================
    /**
     * Search for code patterns using AST matching
     */
    async search(options) {
        const { pattern, language, path: searchPath = '.', include, exclude, maxResults = 100 } = options;
        const args = ['run', '--pattern', pattern, '--json'];
        if (language) {
            args.push('--lang', language);
        }
        if (include && include.length > 0) {
            for (const inc of include) {
                args.push('--include', inc);
            }
        }
        if (exclude && exclude.length > 0) {
            for (const exc of exclude) {
                args.push('--exclude', exc);
            }
        }
        args.push(searchPath);
        try {
            const output = await this.runAstGrep(args);
            const results = this.parseSearchResults(output);
            return {
                matches: results.slice(0, maxResults),
                totalMatches: results.length,
                searchedFiles: this.countUniqueFiles(results),
                language: language || 'auto',
            };
        }
        catch (error) {
            // ast-grep returns non-zero exit code when no matches found
            if (String(error).includes('No matches found') || String(error).includes('exit code')) {
                return {
                    matches: [],
                    totalMatches: 0,
                    searchedFiles: 0,
                    language: language || 'auto',
                };
            }
            throw error;
        }
    }
    /**
     * Search and replace using AST patterns
     */
    async replace(options) {
        const { pattern, replacement, language, path: searchPath = '.', include, exclude, dryRun = true, } = options;
        const args = ['run', '--pattern', pattern, '--rewrite', replacement];
        if (language) {
            args.push('--lang', language);
        }
        if (include && include.length > 0) {
            for (const inc of include) {
                args.push('--include', inc);
            }
        }
        if (exclude && exclude.length > 0) {
            for (const exc of exclude) {
                args.push('--exclude', exc);
            }
        }
        if (dryRun) {
            args.push('--json');
        }
        else {
            args.push('--update-all');
        }
        args.push(searchPath);
        try {
            const output = await this.runAstGrep(args);
            if (dryRun) {
                const matches = this.parseSearchResults(output);
                return {
                    success: true,
                    filesChanged: this.countUniqueFiles(matches),
                    totalReplacements: matches.length,
                    changes: this.groupByFile(matches).map(group => ({
                        file: group.file,
                        replacements: group.matches.length,
                    })),
                };
            }
            else {
                // Parse update results
                return {
                    success: true,
                    filesChanged: 1, // ast-grep doesn't provide detailed counts
                    totalReplacements: 1,
                    changes: [],
                };
            }
        }
        catch (error) {
            return {
                success: false,
                filesChanged: 0,
                totalReplacements: 0,
                changes: [],
                errors: [String(error)],
            };
        }
    }
    /**
     * Apply a refactoring rule
     */
    async applyRule(rule, searchPath = '.', dryRun = true) {
        return this.replace({
            pattern: rule.pattern,
            replacement: rule.replacement,
            language: rule.language,
            path: searchPath,
            dryRun,
        });
    }
    /**
     * Validate a pattern
     */
    async validatePattern(pattern, language) {
        const testFile = path.join(this.tempDir, `test.${this.getExtension(language)}`);
        fs.writeFileSync(testFile, '// test');
        try {
            await this.runAstGrep(['run', '--pattern', pattern, '--lang', language, testFile]);
            return { valid: true };
        }
        catch (error) {
            const errorMsg = String(error);
            if (errorMsg.includes('invalid pattern') || errorMsg.includes('parse error')) {
                return { valid: false, error: errorMsg };
            }
            // No matches is OK - pattern is still valid
            return { valid: true };
        }
        finally {
            fs.unlinkSync(testFile);
        }
    }
    // ============================================
    // Built-in Patterns
    // ============================================
    /**
     * Find function/method definitions
     */
    async findFunctions(searchPath, language) {
        const patterns = {
            typescript: 'function $NAME($$$PARAMS) { $$$ }',
            javascript: 'function $NAME($$$PARAMS) { $$$ }',
            python: 'def $NAME($$$PARAMS): $$$',
            go: 'func $NAME($$$PARAMS) $$$RET { $$$ }',
            rust: 'fn $NAME($$$PARAMS) $$$RET { $$$ }',
        };
        const lang = language || await this.detectLanguage(searchPath);
        const pattern = patterns[lang] || patterns.typescript;
        return this.search({ pattern, language: lang, path: searchPath });
    }
    /**
     * Find class definitions
     */
    async findClasses(searchPath, language) {
        const patterns = {
            typescript: 'class $NAME { $$$ }',
            javascript: 'class $NAME { $$$ }',
            python: 'class $NAME: $$$',
            go: 'type $NAME struct { $$$ }',
            rust: 'struct $NAME { $$$ }',
        };
        const lang = language || await this.detectLanguage(searchPath);
        const pattern = patterns[lang] || patterns.typescript;
        return this.search({ pattern, language: lang, path: searchPath });
    }
    /**
     * Find imports
     */
    async findImports(searchPath, moduleName, language) {
        const patterns = {
            typescript: moduleName ? `import $$$ from '${moduleName}'` : "import $$$ from '$MODULE'",
            javascript: moduleName ? `import $$$ from '${moduleName}'` : "import $$$ from '$MODULE'",
            python: moduleName ? `import ${moduleName}` : 'import $MODULE',
            go: moduleName ? `import "${moduleName}"` : 'import "$MODULE"',
            rust: moduleName ? `use ${moduleName}` : 'use $MODULE',
        };
        const lang = language || await this.detectLanguage(searchPath);
        const pattern = patterns[lang] || patterns.typescript;
        return this.search({ pattern, language: lang, path: searchPath });
    }
    /**
     * Find console.log / print statements (for cleanup)
     */
    async findDebugStatements(searchPath, language) {
        const patterns = {
            typescript: 'console.log($$$)',
            javascript: 'console.log($$$)',
            python: 'print($$$)',
            go: 'fmt.Println($$$)',
            rust: 'println!($$$)',
        };
        const lang = language || await this.detectLanguage(searchPath);
        const pattern = patterns[lang] || patterns.typescript;
        return this.search({ pattern, language: lang, path: searchPath });
    }
    /**
     * Find TODO/FIXME comments
     */
    async findTodoComments(searchPath) {
        // This is tricky with ast-grep, use regex instead
        return this.search({
            pattern: '// TODO: $$$',
            path: searchPath,
        });
    }
    // ============================================
    // Common Refactoring Patterns
    // ============================================
    /**
     * Common refactoring rules
     */
    getRefactorRules() {
        return [
            // TypeScript/JavaScript
            {
                id: 'ts-var-to-const',
                name: 'Convert var to const',
                description: 'Replace var declarations with const for immutable variables',
                language: 'typescript',
                pattern: 'var $NAME = $VALUE',
                replacement: 'const $NAME = $VALUE',
                severity: 'warning',
            },
            {
                id: 'ts-function-to-arrow',
                name: 'Convert function to arrow',
                description: 'Convert function expressions to arrow functions',
                language: 'typescript',
                pattern: 'function($$$PARAMS) { return $BODY }',
                replacement: '($$$PARAMS) => $BODY',
                severity: 'info',
            },
            {
                id: 'ts-remove-console-log',
                name: 'Remove console.log',
                description: 'Remove console.log statements',
                language: 'typescript',
                pattern: 'console.log($$$)',
                replacement: '',
                severity: 'warning',
            },
            {
                id: 'ts-optional-chaining',
                name: 'Use optional chaining',
                description: 'Convert && chains to optional chaining',
                language: 'typescript',
                pattern: '$A && $A.$B',
                replacement: '$A?.$B',
                severity: 'info',
            },
            {
                id: 'ts-nullish-coalescing',
                name: 'Use nullish coalescing',
                description: 'Convert || to ?? for defaults',
                language: 'typescript',
                pattern: '$A || $DEFAULT',
                replacement: '$A ?? $DEFAULT',
                severity: 'info',
            },
            // Python
            {
                id: 'py-remove-print',
                name: 'Remove print statements',
                description: 'Remove debug print statements',
                language: 'python',
                pattern: 'print($$$)',
                replacement: '',
                severity: 'warning',
            },
            {
                id: 'py-f-string',
                name: 'Use f-strings',
                description: 'Convert .format() to f-strings',
                language: 'python',
                pattern: '"$STR".format($$$ARGS)',
                replacement: 'f"$STR"',
                severity: 'info',
            },
            // Go
            {
                id: 'go-remove-println',
                name: 'Remove fmt.Println',
                description: 'Remove debug print statements',
                language: 'go',
                pattern: 'fmt.Println($$$)',
                replacement: '',
                severity: 'warning',
            },
        ];
    }
    // ============================================
    // Helper Methods
    // ============================================
    /**
     * Normalize path for ast-grep CLI on Windows
     * Converts backslashes to forward slashes (ast-grep accepts both on Windows)
     */
    normalizePath(inputPath) {
        if (process.platform !== 'win32') {
            return inputPath;
        }
        // Just convert backslashes to forward slashes
        // ast-grep can handle C:/source/... format on Windows
        return inputPath.replace(/\\/g, '/');
    }
    /**
     * Normalize all path arguments in the args array
     */
    normalizeArgs(args) {
        if (process.platform !== 'win32') {
            return args;
        }
        return args.map((arg, index) => {
            // Last argument is typically the path, and arguments after --path, --include, --exclude flags
            const prevArg = args[index - 1];
            if (index === args.length - 1 ||
                prevArg === '--path' ||
                prevArg === '--include' ||
                prevArg === '--exclude') {
                // Check if this looks like a path (contains backslash or drive letter)
                if (arg.includes('\\') || /^[A-Za-z]:/.test(arg)) {
                    return this.normalizePath(arg);
                }
            }
            return arg;
        });
    }
    async runAstGrep(args) {
        const normalizedArgs = this.normalizeArgs(args);
        return new Promise((resolve, reject) => {
            // Use shell: false to avoid special character interpretation
            // This requires the sg command to be directly executable
            const proc = spawn(this.astGrepPath, normalizedArgs, {
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: false,
                // On Windows, spawn will search PATH for executables with .exe/.cmd extensions
                windowsVerbatimArguments: false,
            });
            let stdout = '';
            let stderr = '';
            proc.stdout?.on('data', (data) => {
                stdout += data.toString();
            });
            proc.stderr?.on('data', (data) => {
                stderr += data.toString();
            });
            proc.on('error', (error) => {
                reject(new Error(`Failed to run ast-grep: ${error.message}`));
            });
            proc.on('close', (code) => {
                if (code !== 0 && stderr) {
                    reject(new Error(stderr));
                }
                else {
                    resolve(stdout);
                }
            });
        });
    }
    parseSearchResults(output) {
        if (!output.trim())
            return [];
        try {
            const matches = [];
            // First, try to parse the entire output as a JSON array
            try {
                const result = JSON.parse(output.trim());
                if (Array.isArray(result)) {
                    for (const item of result) {
                        matches.push(this.parseMatchItem(item));
                    }
                    return matches;
                }
            }
            catch {
                // Not a single JSON array, try line-by-line parsing (JSONL format)
            }
            // Fallback: parse as JSONL (one JSON object per line)
            const lines = output.trim().split('\n');
            for (const line of lines) {
                if (!line.trim())
                    continue;
                try {
                    const result = JSON.parse(line);
                    if (Array.isArray(result)) {
                        for (const item of result) {
                            matches.push(this.parseMatchItem(item));
                        }
                    }
                    else if (result.file || result.path) {
                        matches.push(this.parseMatchItem(result));
                    }
                }
                catch {
                    // Not JSON, try parsing as text output
                    const textMatch = this.parseTextMatch(line);
                    if (textMatch)
                        matches.push(textMatch);
                }
            }
            return matches;
        }
        catch {
            return [];
        }
    }
    parseMatchItem(item) {
        return {
            file: (item.file || item.path || ''),
            line: (item.range?.start?.line || item.line || 0),
            column: (item.range?.start?.column || item.column || 0),
            endLine: (item.range?.end?.line || item.endLine || 0),
            endColumn: (item.range?.end?.column || item.endColumn || 0),
            text: (item.text || item.matched || ''),
            replacement: item.replacement,
            metaVariables: item.metaVariables,
        };
    }
    parseTextMatch(line) {
        // Parse text format: file:line:column:text
        const match = line.match(/^(.+?):(\d+):(\d+):(.*)$/);
        if (!match)
            return null;
        return {
            file: match[1],
            line: parseInt(match[2], 10) - 1,
            column: parseInt(match[3], 10) - 1,
            endLine: parseInt(match[2], 10) - 1,
            endColumn: parseInt(match[3], 10) - 1,
            text: match[4].trim(),
        };
    }
    countUniqueFiles(matches) {
        return new Set(matches.map(m => m.file)).size;
    }
    groupByFile(matches) {
        const groups = new Map();
        for (const match of matches) {
            const existing = groups.get(match.file) || [];
            existing.push(match);
            groups.set(match.file, existing);
        }
        return Array.from(groups.entries()).map(([file, matches]) => ({ file, matches }));
    }
    async detectLanguage(searchPath) {
        const resolvedPath = path.resolve(searchPath);
        if (fs.statSync(resolvedPath).isFile()) {
            return this.getLanguageFromExtension(resolvedPath);
        }
        // Check for language indicators in directory
        const files = fs.readdirSync(resolvedPath);
        if (files.includes('package.json') || files.includes('tsconfig.json')) {
            return 'typescript';
        }
        if (files.includes('pyproject.toml') || files.includes('setup.py')) {
            return 'python';
        }
        if (files.includes('go.mod')) {
            return 'go';
        }
        if (files.includes('Cargo.toml')) {
            return 'rust';
        }
        return 'typescript'; // Default
    }
    getLanguageFromExtension(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        for (const [lang, extensions] of Object.entries(LANGUAGE_EXTENSIONS)) {
            if (extensions.includes(ext)) {
                return lang;
            }
        }
        return 'typescript';
    }
    getExtension(language) {
        const extensions = LANGUAGE_EXTENSIONS[language];
        return extensions ? extensions[0].slice(1) : 'ts';
    }
    /**
     * Check if ast-grep is installed
     */
    async isInstalled() {
        try {
            await this.runAstGrep(['--version']);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Get ast-grep version
     */
    async getVersion() {
        try {
            const output = await this.runAstGrep(['--version']);
            return output.trim();
        }
        catch {
            return null;
        }
    }
}
// Singleton instance
let engineInstance = null;
export function getASTGrepEngine() {
    if (!engineInstance) {
        engineInstance = new ASTGrepEngine();
    }
    return engineInstance;
}
//# sourceMappingURL=engine.js.map