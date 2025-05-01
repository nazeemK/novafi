# Terminal Operations Rules

## Environment Setup

1. **Node.js Version**
   - Required: Node.js v16 or higher
   - Check version: `node --version`
   - Install from: https://nodejs.org/

2. **Package Manager**
   - Primary: npm (comes with Node.js)
   - Alternative: yarn (optional)
   - Check npm version: `npm --version`

3. **MongoDB**
   - Required: MongoDB v5.0 or higher
   - Check version: `mongod --version`
   - Install from: https://www.mongodb.com/try/download/community

## Project Commands

### Backend Operations

1. **Installation**
   ```bash
   # Navigate to backend directory
   cd backend

   # Clean install (if needed)
   rm -rf node_modules
   rm package-lock.json
   npm cache clean --force

   # Install dependencies
   npm install
   ```

2. **Development**
   ```bash
   # Start development server
   npm run dev

   # Build TypeScript
   npm run build

   # Start production server
   npm start
   ```

3. **Database**
   ```bash
   # Start MongoDB (if not running as a service)
   mongod --dbpath /path/to/data/directory
   ```

### Frontend Operations

1. **Installation**
   ```bash
   # Navigate to frontend directory
   cd frontend

   # Clean install (if needed)
   rm -rf node_modules
   rm package-lock.json
   npm cache clean --force

   # Install dependencies
   npm install
   ```

2. **Development**
   ```bash
   # Start development server
   npm run dev

   # Build for production
   npm run build
   ```

## Common Issues and Solutions

1. **Permission Errors**
   - Windows: Run PowerShell as Administrator
   - Linux/Mac: Use `sudo` when necessary

2. **Port Conflicts**
   - Backend default: 3000
   - Frontend default: 5173
   - Check if ports are in use: 
     - Windows: `netstat -ano | findstr :3000`
     - Linux/Mac: `lsof -i :3000`

3. **Node Modules Issues**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules: `rm -rf node_modules`
   - Reinstall: `npm install`

4. **TypeScript Compilation**
   - Clear dist folder: `rm -rf dist`
   - Rebuild: `npm run build`

## Environment Variables

1. **Backend (.env)**
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/novafi
   JWT_SECRET=your_jwt_secret
   NODE_ENV=development
   ```

2. **Frontend (.env)**
   ```
   VITE_API_URL=http://localhost:3000
   ```

## Git Operations

1. **Initial Setup**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Branch Management**
   ```bash
   # Create feature branch
   git checkout -b feature/name

   # Switch branches
   git checkout branch_name
   ```

## Security Considerations

1. **Never commit sensitive data**
   - .env files
   - API keys
   - Credentials

2. **File permissions**
   - Set appropriate file permissions
   - Use .gitignore for sensitive files

## Best Practices

1. **Command Execution**
   - Always verify current directory before running commands
   - Use absolute paths when necessary
   - Check command output for errors

2. **Package Management**
   - Keep package.json and package-lock.json in sync
   - Regularly update dependencies
   - Use exact versions for critical packages

3. **Error Handling**
   - Check logs for detailed error messages
   - Use appropriate error codes
   - Document common errors and solutions 