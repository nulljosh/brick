#!/usr/bin/env node
// Refresh docs/screenshots/*.jpg from the built site.
//   npm run build && node scripts/screenshots.mjs
// Playwright is borrowed from a sibling repo; set EMAIL/PASSWORD for the signed-in shots.
import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'
const { chromium } = createRequire('/Users/joshua/Documents/Code/vancouvervice/package.json')('playwright')

const preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { stdio: 'ignore' })
await new Promise(r => setTimeout(r, 1500))
const base = 'http://localhost:4173'
const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: 'light' })
const shot = (name) => page.screenshot({ path: `docs/screenshots/${name}.jpg`, type: 'jpeg', quality: 85 })

try {
  await page.goto(base + '/'); await page.waitForTimeout(1500); await shot('landing')
  await page.goto(base + '/login')
  await page.fill('input[type=email]', process.env.EMAIL); await page.fill('input[type=password]', process.env.PASSWORD)
  await page.click('button[type=submit]'); await page.waitForURL('**/browse', { timeout: 15000 })
  await page.waitForTimeout(4000); await shot('browse')
  await page.locator('a[href^="/listing/"]').first().click(); await page.waitForTimeout(3000); await shot('listing')
} finally { await browser.close(); preview.kill() }
