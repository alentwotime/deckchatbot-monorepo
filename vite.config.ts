import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // Library mode configuration
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'DeckChatBot',
      fileName: (format) => `deckchatbot.${format}.js`,
      formats: ['es', 'cjs', 'umd']
    },
    // Node.js target
    target: 'node18',
    rollupOptions: {
      // External dependencies - don't bundle these
      external: [
        'react',
        'react-dom',
        'express',
        'socket.io',
        '@azure/identity',
        '@azure/openai',
        '@azure/cosmos',
        '@azure/storage-blob',
        '@azure/keyvault-secrets',
        'cors',
        'helmet',
        'compression',
        'dotenv',
        'winston',
        'three',
        '@react-three/fiber',
        '@react-three/drei'
      ],
      output: {
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          'three': 'THREE'
        }
      }
    },
    // Static asset handling
    assetsDir: 'assets',
    copyPublicDir: true
  },
  
  // Path aliases
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, 'shared'),
      '@apps': resolve(__dirname, 'apps'),
      '@backend': resolve(__dirname, 'apps/backend'),
      '@frontend': resolve(__dirname, 'apps/frontend'),
      '@ai-service': resolve(__dirname, 'apps/ai-service'),
      '@docs': resolve(__dirname, 'docs'),
      '@scripts': resolve(__dirname, 'scripts')
    }
  },

  // Static asset handling configuration
  assetsInclude: [
    '**/*.png',
    '**/*.jpg',
    '**/*.jpeg',
    '**/*.gif',
    '**/*.svg',
    '**/*.webp',
    '**/*.ico',
    '**/*.woff',
    '**/*.woff2',
    '**/*.ttf',
    '**/*.eot',
    '**/*.otf',
    '**/*.mp3',
    '**/*.mp4',
    '**/*.webm',
    '**/*.ogg',
    '**/*.wav',
    '**/*.glb',
    '**/*.gltf',
    '**/*.obj',
    '**/*.mtl'
  ],

  // Server configuration for development
  server: {
    port: 3000,
    host: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true
      }
    }
  },

  // Environment variables
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __PROD__: JSON.stringify(process.env.NODE_ENV === 'production')
  },

  // Optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'three',
      '@react-three/fiber',
      '@react-three/drei'
    ]
  }
})
