{
  "include": ["client/src/**/*", "shared/**/*", "server/**/*"],
  "exclude": ["node_modules", "build", "dist", "**/*.test.ts"],
  "compilerOptions": {
    "target": "es2017",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "strictNullChecks": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "downlevelIteration": true,
    "incremental": true,
    "noEmit": true,
    "jsx": "preserve",
    "allowImportingTsExtensions": true,
    "baseUrl": ".",
    "types": ["node", "vite/client"],
    "lib": ["esnext", "dom", "dom.iterable"],
    "tsBuildInfoFile": "./node_modules/typescript/tsbuildinfo",
    "paths": {
      "@/*": ["./client/src/*"],
      "@shared/*": ["./shared/*"]
    }
  }
}
