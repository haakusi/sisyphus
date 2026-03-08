#!/usr/bin/env node
/**
 * Sisyphus Setup Script
 *
 * One-command installation for all Sisyphus features:
 * 1. Check prerequisites (Node.js, npm)
 * 2. Install npm dependencies
 * 3. Build TypeScript
 * 4. Register MCP servers with Claude Code
 * 5. Copy skills to ~/.claude/skills/
 * 6. Create environment template
 * 7. Run verification tests
 */
import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawnSync } from 'child_process';
import * as os from 'os';
import { fileURLToPath } from 'url';
// ============================================
// Configuration
// ============================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLUGIN_ROOT = path.resolve(__dirname, '../..');
const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const SKILLS_DIR = path.join(CLAUDE_DIR, 'skills');
const MCP_CONFIG_PATH = path.join(CLAUDE_DIR, 'claude_desktop_config.json');
const SKILLS_TO_INSTALL = [
    // Core skills
    'ultrawork', 'plan', 'quick', 'loop', 'stats', 'deep-research', 'setup-mcp',
    // Keyword aliases
    'ulw', // ultrawork shorthand
    'search', // parallel exploration (search/find)
    'analyze', // deep analysis (analyze/investigate)
    'ultrathink', // extended thinking (think deeply)
];
// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m',
};
function log(message, type = 'info') {
    const prefix = {
        info: `${colors.cyan}[INFO]${colors.reset}`,
        success: `${colors.green}[SUCCESS]${colors.reset}`,
        warn: `${colors.yellow}[WARN]${colors.reset}`,
        error: `${colors.red}[ERROR]${colors.reset}`,
    };
    console.log(`${prefix[type]} ${message}`);
}
function header(text) {
    console.log(`\n${colors.bold}${colors.cyan}${'═'.repeat(60)}${colors.reset}`);
    console.log(`${colors.bold}  ${text}${colors.reset}`);
    console.log(`${colors.cyan}${'═'.repeat(60)}${colors.reset}\n`);
}
// ============================================
// Step 1: Check Prerequisites
// ============================================
function checkPrerequisites() {
    header('Step 1: Checking Prerequisites');
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);
    if (majorVersion < 18) {
        log(`Node.js ${nodeVersion} detected. Requires Node.js 18+`, 'error');
        return false;
    }
    log(`Node.js ${nodeVersion} ✓`, 'success');
    // Check npm
    try {
        const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
        log(`npm ${npmVersion} ✓`, 'success');
    }
    catch {
        log('npm not found', 'error');
        return false;
    }
    // Check for optional dependencies
    try {
        execSync('sg --version', { encoding: 'utf-8', stdio: 'pipe' });
        log('ast-grep (sg) ✓', 'success');
    }
    catch {
        log('ast-grep (sg) not installed - AST tools will not work', 'warn');
        log('  Install with: npm install -g @ast-grep/cli', 'info');
    }
    try {
        execSync('typescript-language-server --version', { encoding: 'utf-8', stdio: 'pipe' });
        log('typescript-language-server ✓', 'success');
    }
    catch {
        log('typescript-language-server not installed - LSP tools will not work', 'warn');
        log('  Install with: npm install -g typescript-language-server typescript', 'info');
    }
    return true;
}
// ============================================
// Step 2: Install Dependencies
// ============================================
function installDependencies() {
    header('Step 2: Installing Dependencies');
    try {
        log('Running npm install...');
        execSync('npm install', {
            cwd: PLUGIN_ROOT,
            stdio: 'inherit',
        });
        log('Dependencies installed ✓', 'success');
        return true;
    }
    catch (error) {
        log(`Failed to install dependencies: ${error}`, 'error');
        return false;
    }
}
// ============================================
// Step 3: Build TypeScript
// ============================================
function buildProject() {
    header('Step 3: Building TypeScript');
    try {
        log('Running npm run build...');
        execSync('npm run build', {
            cwd: PLUGIN_ROOT,
            stdio: 'inherit',
        });
        log('Build completed ✓', 'success');
        return true;
    }
    catch (error) {
        log(`Build failed: ${error}`, 'error');
        return false;
    }
}
// ============================================
// Step 4: Register MCP Servers
// ============================================
function registerMCPServers() {
    header('Step 4: Registering MCP Servers');
    // Ensure .claude directory exists
    if (!fs.existsSync(CLAUDE_DIR)) {
        fs.mkdirSync(CLAUDE_DIR, { recursive: true });
        log(`Created ${CLAUDE_DIR}`, 'info');
    }
    // Load or create MCP config
    let config = { mcpServers: {} };
    if (fs.existsSync(MCP_CONFIG_PATH)) {
        try {
            const content = fs.readFileSync(MCP_CONFIG_PATH, 'utf-8');
            config = JSON.parse(content);
            log('Loaded existing MCP config', 'info');
            // Backup existing config
            const backupPath = MCP_CONFIG_PATH + '.backup';
            fs.writeFileSync(backupPath, content);
            log(`Backed up to ${backupPath}`, 'info');
        }
        catch (error) {
            log(`Failed to parse existing config: ${error}`, 'warn');
        }
    }
    if (!config.mcpServers) {
        config.mcpServers = {};
    }
    // Path to tools server
    const toolsServerPath = path.join(PLUGIN_ROOT, 'dist', 'servers', 'tools-server.js');
    // Add Sisyphus tools server
    config.mcpServers['sisyphus-tools'] = {
        command: 'node',
        args: [toolsServerPath],
        env: {},
    };
    // Write config
    try {
        fs.writeFileSync(MCP_CONFIG_PATH, JSON.stringify(config, null, 2));
        log(`Registered sisyphus-tools MCP server ✓`, 'success');
        log(`Config saved to: ${MCP_CONFIG_PATH}`, 'info');
        return true;
    }
    catch (error) {
        log(`Failed to write MCP config: ${error}`, 'error');
        return false;
    }
}
// ============================================
// Step 5: Link Skills (Symlink for auto-update)
// ============================================
function removeExisting(targetPath) {
    if (!fs.existsSync(targetPath)) {
        return;
    }
    const stats = fs.lstatSync(targetPath);
    if (stats.isSymbolicLink()) {
        // Remove symlink
        fs.unlinkSync(targetPath);
    }
    else if (stats.isDirectory()) {
        // Remove directory recursively
        fs.rmSync(targetPath, { recursive: true, force: true });
    }
    else {
        // Remove file
        fs.unlinkSync(targetPath);
    }
}
function linkSkills() {
    header('Step 5: Linking Skills (Auto-update enabled)');
    // Ensure skills directory exists
    if (!fs.existsSync(SKILLS_DIR)) {
        fs.mkdirSync(SKILLS_DIR, { recursive: true });
        log(`Created ${SKILLS_DIR}`, 'info');
    }
    const sourceSkillsDir = path.join(PLUGIN_ROOT, 'skills');
    const isWindows = os.platform() === 'win32';
    for (const skill of SKILLS_TO_INSTALL) {
        const sourcePath = path.join(sourceSkillsDir, skill);
        const destPath = path.join(SKILLS_DIR, skill);
        if (!fs.existsSync(sourcePath)) {
            log(`Skill not found: ${sourcePath}`, 'warn');
            continue;
        }
        try {
            // Remove existing link/directory
            removeExisting(destPath);
            // Create symlink (junction on Windows for no admin rights)
            if (isWindows) {
                // Use junction on Windows (no admin required)
                fs.symlinkSync(sourcePath, destPath, 'junction');
            }
            else {
                // Use dir symlink on Unix
                fs.symlinkSync(sourcePath, destPath, 'dir');
            }
            log(`Linked skill: ${skill} → ${sourcePath} ✓`, 'success');
        }
        catch (error) {
            log(`Failed to link ${skill}: ${error}`, 'error');
            // Fallback to copy if symlink fails
            log(`Falling back to copy for ${skill}...`, 'warn');
            try {
                copyDirectory(sourcePath, destPath);
                log(`Copied skill: ${skill} (fallback) ✓`, 'success');
            }
            catch (copyError) {
                log(`Failed to copy ${skill}: ${copyError}`, 'error');
            }
        }
    }
    log('', 'info');
    log('Skills are now symlinked to the repo.', 'info');
    log('After git pull, new skills will be available immediately.', 'info');
    log('No need to run setup again for skill updates!', 'success');
    return true;
}
function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath);
        }
        else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}
// ============================================
// Step 6: Create Environment Template
// ============================================
function createEnvTemplate() {
    header('Step 6: Creating Environment Template');
    const envPath = path.join(PLUGIN_ROOT, '.env.example');
    const envContent = `# Sisyphus Plugin Environment Variables
# Copy this to .env and fill in your values

# GitHub (for GitHub MCP server)
GITHUB_TOKEN=ghp_your_token_here

# Figma (for Figma MCP server - Frontend team)
FIGMA_ACCESS_TOKEN=figd_your_token_here

# OpenAI (optional - for external model delegation)
# OPENAI_API_KEY=sk-your_key_here

# Google (optional - for Gemini delegation)
# GOOGLE_API_KEY=your_key_here
`;
    try {
        fs.writeFileSync(envPath, envContent);
        log(`Created ${envPath} ✓`, 'success');
        return true;
    }
    catch (error) {
        log(`Failed to create env template: ${error}`, 'error');
        return false;
    }
}
// ============================================
// Step 7: Verification
// ============================================
function runVerification() {
    header('Step 7: Verification');
    let allPassed = true;
    // Check build output exists
    const toolsServer = path.join(PLUGIN_ROOT, 'dist', 'servers', 'tools-server.js');
    if (fs.existsSync(toolsServer)) {
        log('Build output exists ✓', 'success');
    }
    else {
        log('Build output not found', 'error');
        allPassed = false;
    }
    // Check MCP config
    if (fs.existsSync(MCP_CONFIG_PATH)) {
        try {
            const config = JSON.parse(fs.readFileSync(MCP_CONFIG_PATH, 'utf-8'));
            if (config.mcpServers?.['sisyphus-tools']) {
                log('MCP server registered ✓', 'success');
            }
            else {
                log('MCP server not in config', 'error');
                allPassed = false;
            }
        }
        catch {
            log('Invalid MCP config', 'error');
            allPassed = false;
        }
    }
    // Check skills installed
    for (const skill of SKILLS_TO_INSTALL) {
        const skillPath = path.join(SKILLS_DIR, skill, 'SKILL.md');
        if (fs.existsSync(skillPath)) {
            log(`Skill /${skill} installed ✓`, 'success');
        }
        else {
            log(`Skill /${skill} not found`, 'warn');
        }
    }
    // Try to start MCP server (quick test)
    log('Testing MCP server startup...', 'info');
    const testResult = spawnSync('node', [toolsServer], {
        timeout: 3000,
        input: '', // Empty input to trigger immediate exit
        stdio: ['pipe', 'pipe', 'pipe'],
    });
    if (testResult.status === null && testResult.signal === 'SIGTERM') {
        // Server started and was killed by timeout - that's good
        log('MCP server starts successfully ✓', 'success');
    }
    else if (testResult.stderr && testResult.stderr.toString().includes('running on stdio')) {
        log('MCP server starts successfully ✓', 'success');
    }
    else {
        log('MCP server may have issues', 'warn');
        if (testResult.stderr) {
            log(testResult.stderr.toString().slice(0, 200), 'info');
        }
    }
    return allPassed;
}
// ============================================
// Main
// ============================================
async function main() {
    console.log(`
${colors.bold}${colors.cyan}
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ███████╗██╗███████╗██╗   ██╗██████╗ ██╗  ██╗██╗   ██╗███████╗║
║   ██╔════╝██║██╔════╝╚██╗ ██╔╝██╔══██╗██║  ██║██║   ██║██╔════╝║
║   ███████╗██║███████╗ ╚████╔╝ ██████╔╝███████║██║   ██║███████╗║
║   ╚════██║██║╚════██║  ╚██╔╝  ██╔═══╝ ██╔══██║██║   ██║╚════██║║
║   ███████║██║███████║   ██║   ██║     ██║  ██║╚██████╔╝███████║║
║   ╚══════╝╚═╝╚══════╝   ╚═╝   ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚══════╝║
║                                                               ║
║              Ultrawork Plugin Setup v1.0.0                    ║
╚═══════════════════════════════════════════════════════════════╝
${colors.reset}
`);
    const steps = [
        { name: 'Prerequisites', fn: checkPrerequisites },
        { name: 'Dependencies', fn: installDependencies },
        { name: 'Build', fn: buildProject },
        { name: 'MCP Servers', fn: registerMCPServers },
        { name: 'Skills', fn: linkSkills },
        { name: 'Environment', fn: createEnvTemplate },
        { name: 'Verification', fn: runVerification },
    ];
    let allPassed = true;
    for (const step of steps) {
        const result = step.fn();
        if (!result) {
            allPassed = false;
            log(`Step "${step.name}" had issues`, 'warn');
        }
    }
    // Final summary
    console.log(`\n${'═'.repeat(60)}`);
    if (allPassed) {
        console.log(`${colors.green}${colors.bold}
  ✓ Setup completed successfully!

  Next steps:
  1. Restart Claude Code
  2. Try: /ultrawork 테스트
  3. Try: /quick find all .ts files

  Optional:
  - Install ast-grep: npm install -g @ast-grep/cli
  - Install LSP: npm install -g typescript-language-server typescript
  - Set environment variables in .env file
${colors.reset}`);
    }
    else {
        console.log(`${colors.yellow}${colors.bold}
  ⚠ Setup completed with warnings

  Some features may not work. Check the logs above for details.
  You can re-run this setup after fixing issues.
${colors.reset}`);
    }
}
main().catch((error) => {
    log(`Setup failed: ${error}`, 'error');
    process.exit(1);
});
//# sourceMappingURL=setup.js.map