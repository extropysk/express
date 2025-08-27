import path from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { name } from './package.json'

const formattedName = name.match(/[^/]+$/)?.[0] ?? name

export default defineConfig({
  plugins: [dts()],
  build: {
    rollupOptions: {
      external: ['http', 'stream'],
    },
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: formattedName,
    },
  },
})
