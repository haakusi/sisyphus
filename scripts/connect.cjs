#!/usr/bin/env node
/**
 * Connect Script - OAuth authentication for Antigravity and Codex
 *
 * Usage:
 *   node connect.js antigravity
 *   node connect.js codex
 *   node connect.js all
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Credentials storage
const CREDENTIALS_DIR = path.join(require('os').homedir(), '.config', 'claude-sisyphus');
const CREDENTIALS_FILE = path.join(CREDENTIALS_DIR, 'credentials.json');

// Ensure directory exists
if (!fs.existsSync(CREDENTIALS_DIR)) {
  fs.mkdirSync(CREDENTIALS_DIR, { recursive: true });
}

// Load/save credentials
function loadCredentials() {
  if (!fs.existsSync(CREDENTIALS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
  } catch { return {}; }
}

function saveCredentials(creds) {
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(creds, null, 2));
}

// Open browser
function openBrowser(url) {
  const cmd = process.platform === 'win32' ? 'start' :
              process.platform === 'darwin' ? 'open' : 'xdg-open';
  exec(`${cmd} "${url}"`);
}

// ============================================
// Antigravity OAuth
// ============================================
async function connectAntigravity() {
  return new Promise((resolve) => {
    const PORT = 8095;
    const CLIENT_ID = '764086051850-6qr4p6gpi6hn506pt8ejuq83di341hur.apps.googleusercontent.com';
    const REDIRECT_URI = `http://localhost:${PORT}/callback`;
    const SCOPES = [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/generative-language',
    ];

    const server = http.createServer(async (req, res) => {
      const parsed = url.parse(req.url, true);

      if (parsed.pathname === '/callback') {
        const code = parsed.query.code;
        const error = parsed.query.error;

        if (error) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<h1>❌ 인증 실패: ${error}</h1><p>창을 닫아주세요.</p>`);
          server.close();
          resolve({ success: false, error });
          return;
        }

        if (code) {
          try {
            // Exchange code for tokens
            const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                code,
                client_id: CLIENT_ID,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code',
              }),
            });

            const tokens = await tokenRes.json();

            if (tokens.error) {
              throw new Error(tokens.error_description || tokens.error);
            }

            // Get user info
            const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: { 'Authorization': `Bearer ${tokens.access_token}` },
            });
            const user = await userRes.json();

            // Save credentials
            const creds = loadCredentials();
            creds.antigravity = {
              provider: 'antigravity',
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
              expiresAt: Date.now() + tokens.expires_in * 1000,
              email: user.email,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            saveCredentials(creds);

            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
              <html><body style="font-family: sans-serif; text-align: center; padding: 50px; background: #1a1a2e; color: white;">
                <h1>✅ Antigravity 연결 성공!</h1>
                <p>${user.email} 계정으로 연결되었습니다.</p>
                <p style="color: #888;">이 창을 닫고 Claude Code로 돌아가세요.</p>
              </body></html>
            `);

            server.close();
            resolve({ success: true, email: user.email });
          } catch (err) {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`<h1>❌ 토큰 교환 실패</h1><p>${err.message}</p>`);
            server.close();
            resolve({ success: false, error: err.message });
          }
        }
      }
    });

    server.listen(PORT, () => {
      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: SCOPES.join(' '),
        access_type: 'offline',
        prompt: 'consent',
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

      console.log('\n🔐 Antigravity 인증');
      console.log('브라우저에서 Google 계정으로 로그인하세요...\n');

      openBrowser(authUrl);
    });

    setTimeout(() => {
      server.close();
      resolve({ success: false, error: '시간 초과' });
    }, 5 * 60 * 1000);
  });
}

// ============================================
// Codex OAuth
// ============================================
async function connectCodex() {
  return new Promise((resolve) => {
    const PORT = 8096;
    const CLIENT_ID = 'pdlLIX2Y72MgDdqq36aVN5DlpmGdEMGh';
    const REDIRECT_URI = `http://localhost:${PORT}/callback`;
    const SCOPES = ['openid', 'profile', 'email', 'offline_access'];

    const server = http.createServer(async (req, res) => {
      const parsed = url.parse(req.url, true);

      if (parsed.pathname === '/callback') {
        const code = parsed.query.code;
        const error = parsed.query.error;

        if (error) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<h1>❌ 인증 실패: ${error}</h1>`);
          server.close();
          resolve({ success: false, error });
          return;
        }

        if (code) {
          try {
            const tokenRes = await fetch('https://auth0.openai.com/oauth/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                grant_type: 'authorization_code',
                code,
                client_id: CLIENT_ID,
                redirect_uri: REDIRECT_URI,
              }),
            });

            const tokens = await tokenRes.json();

            if (tokens.error) {
              throw new Error(tokens.error_description || tokens.error);
            }

            // Save credentials
            const creds = loadCredentials();
            creds.codex = {
              provider: 'codex',
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
              expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            saveCredentials(creds);

            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
              <html><body style="font-family: sans-serif; text-align: center; padding: 50px; background: #1a1a2e; color: white;">
                <h1>✅ Codex 연결 성공!</h1>
                <p>OpenAI 계정으로 연결되었습니다.</p>
                <p style="color: #888;">이 창을 닫고 Claude Code로 돌아가세요.</p>
              </body></html>
            `);

            server.close();
            resolve({ success: true });
          } catch (err) {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`<h1>❌ 토큰 교환 실패</h1><p>${err.message}</p>`);
            server.close();
            resolve({ success: false, error: err.message });
          }
        }
      }
    });

    server.listen(PORT, () => {
      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: SCOPES.join(' '),
        audience: 'https://api.openai.com/v1',
      });

      const authUrl = `https://auth0.openai.com/authorize?${params}`;

      console.log('\n🔐 Codex 인증');
      console.log('브라우저에서 OpenAI 계정으로 로그인하세요...\n');

      openBrowser(authUrl);
    });

    setTimeout(() => {
      server.close();
      resolve({ success: false, error: '시간 초과' });
    }, 5 * 60 * 1000);
  });
}

// ============================================
// Main
// ============================================
async function main() {
  const service = process.argv[2] || 'all';

  console.log('═══════════════════════════════════════');
  console.log('  🔗 AI Service Connect');
  console.log('═══════════════════════════════════════\n');

  if (service === 'antigravity' || service === 'all') {
    const result = await connectAntigravity();
    if (result.success) {
      console.log(`✅ Antigravity 연결 완료${result.email ? ` (${result.email})` : ''}`);
    } else {
      console.log(`❌ Antigravity 연결 실패: ${result.error}`);
    }
  }

  if (service === 'codex' || service === 'all') {
    const result = await connectCodex();
    if (result.success) {
      console.log('✅ Codex 연결 완료');
    } else {
      console.log(`❌ Codex 연결 실패: ${result.error}`);
    }
  }

  // Show status
  console.log('\n═══════════════════════════════════════');
  console.log('  📋 연결 상태');
  console.log('═══════════════════════════════════════\n');

  const creds = loadCredentials();

  if (creds.antigravity) {
    const expiry = new Date(creds.antigravity.expiresAt).toLocaleString();
    console.log(`Antigravity: ✅ 연결됨 (${creds.antigravity.email || 'OAuth'})`);
    console.log(`  만료: ${expiry}`);
  } else {
    console.log('Antigravity: ❌ 미연결');
  }

  if (creds.codex) {
    const expiry = new Date(creds.codex.expiresAt).toLocaleString();
    console.log(`Codex: ✅ 연결됨`);
    console.log(`  만료: ${expiry}`);
  } else {
    console.log('Codex: ❌ 미연결');
  }

  console.log('\n저장 위치:', CREDENTIALS_FILE);
}

main().catch(console.error);
