import react from '@vitejs/plugin-react'
import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import { resolveApiUrl } from './src/services/apiConfig.js'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    resolveApiUrl({ ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env, PROD: true })
  }
  return { plugins: [react()] }
})
