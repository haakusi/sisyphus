#!/bin/bash
# Sisyphus Plugin Installer for macOS/Linux
# Usage: curl -sSL https://gitlab.suprema.co.kr/claude-code/sisyphus/-/raw/main/install.sh | bash
# Or: ./install.sh

set -e

echo "=== Sisyphus Plugin Installer ==="

INSTALL_PATH="$HOME/.claude-sisyphus"

# 1. Clone or Update
if [ -d "$INSTALL_PATH" ]; then
    echo "Updating existing installation..."
    cd "$INSTALL_PATH"
    git pull origin main
else
    echo "Cloning repository..."
    git clone git@gitlab.suprema.co.kr:claude-code/sisyphus.git "$INSTALL_PATH"
    cd "$INSTALL_PATH"
fi

# 2. Build
echo "Installing dependencies and building..."
npm install
npm run build

# 3. Copy skills to global Claude skills folder
SKILLS_DEST="$HOME/.claude/skills"
mkdir -p "$SKILLS_DEST"

echo "Copying skills to global folder..."
cp -r "$INSTALL_PATH/skills/"* "$SKILLS_DEST/"

# 4. Optional: Copy MCP config
MCP_DEST="$HOME/.claude/mcp.json"
if [ ! -f "$MCP_DEST" ]; then
    cp "$INSTALL_PATH/.mcp.json" "$MCP_DEST"
    echo "MCP config copied."
else
    echo "MCP config already exists. Skipping..."
fi

echo ""
echo "=== Installation Complete ==="
echo ""
echo "Available commands:"
echo "  /ultrawork <task>  - Full orchestration mode"
echo "  /plan <task>       - Planning mode"
echo "  /quick <task>      - Fast execution"
echo "  /loop <task>       - Continuous execution"
echo "  /stats             - Session statistics"
echo ""
echo "Restart Claude Code to apply changes."
echo ""
echo "To update later: cd ~/.claude-sisyphus && git pull && npm run build"
