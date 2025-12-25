# Deployment Build Fix

## Issue
The deployment was failing with the error:
```
npm error could not determine executable to run
```

When running `npx craco build`, indicating that the craco package was not installed.

## Root Cause
In a fresh deployment environment, the `node_modules` directory doesn't exist. The build script was attempting to run the build without first installing dependencies, causing the `npx craco build` command to fail because `@craco/craco` wasn't available.

## Solution Applied

### 1. Updated Root Build Script
Modified `/package.json` to install dependencies before building:
```json
"build": "cd frontend && npm install --legacy-peer-deps && npm run build"
```

This ensures that in any deployment environment (fresh or existing), all dependencies are installed before the build process starts.

### 2. Updated Frontend Scripts
Modified `/frontend/package.json` to use `npx` for all craco commands:
- `"start": "npx craco start"`
- `"build": "npx craco build"`
- `"test": "npx craco test"`

Using `npx` ensures the command can locate the binary in `node_modules/.bin`.

## Verification
Build now completes successfully:
```bash
npm run build
# Output: Compiled successfully.
```

## What is Craco?
CRACO (Create React App Configuration Override) is used in this project to:
- Set up webpack aliases (e.g., `@` points to `src` directory)
- Configure custom webpack settings
- Enable optional plugins for development

## Testing
Tested in a clean environment (with node_modules deleted):
```bash
rm -rf frontend/node_modules
npm run build
# Result: Compiled successfully after installing 1477 packages
```

## Deployment Instructions

The deployment process is now fully automated. Simply run:
```bash
npm run build
```

This single command will:
1. Navigate to the frontend directory
2. Install all dependencies (including devDependencies)
3. Run the production build
4. Output the build files to `frontend/build/`

## What is Craco?
CRACO (Create React App Configuration Override) is used in this project to:
- Set up webpack aliases (e.g., `@` points to `src` directory)
- Configure custom webpack settings
- Enable optional plugins for development

## Key Points
- No manual dependency installation required before deployment
- The build script handles everything automatically
- Works in both fresh and existing environments
- All dependencies (including @craco/craco) are installed during the build process
