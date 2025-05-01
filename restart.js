const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Define directories
const frontendDir = path.join(__dirname, 'frontend');
const backendDir = path.join(__dirname, 'backend');

// Check if directories exist
if (!fs.existsSync(frontendDir)) {
  console.error('Frontend directory not found!');
  process.exit(1);
}

if (!fs.existsSync(backendDir)) {
  console.error('Backend directory not found!');
  process.exit(1);
}

// Function to kill processes on specific ports
const killProcessOnPort = async (port) => {
  // For Windows
  if (process.platform === 'win32') {
    const findProcess = spawn('netstat', ['-ano']);
    
    const rl = readline.createInterface({
      input: findProcess.stdout,
      crlfDelay: Infinity
    });
    
    let pid = null;
    
    for await (const line of rl) {
      if (line.includes(`127.0.0.1:${port}`) || line.includes(`0.0.0.0:${port}`)) {
        pid = line.trim().split(/\s+/).pop();
        break;
      }
    }
    
    if (pid) {
      console.log(`Killing process with PID: ${pid} on port ${port}`);
      spawn('taskkill', ['/F', '/PID', pid]);
    } else {
      console.log(`No process found on port ${port}`);
    }
  } else {
    // For Unix-like systems
    spawn('kill', [`$(lsof -t -i:${port})`], { shell: true });
  }
};

// Function to start the frontend
const startFrontend = () => {
  console.log('Starting frontend...');
  const frontend = spawn('npm', ['run', 'dev'], { 
    cwd: frontendDir,
    stdio: 'inherit',
    shell: true 
  });
  
  frontend.on('error', (error) => {
    console.error(`Frontend start error: ${error.message}`);
  });
  
  return frontend;
};

// Function to start the backend
const startBackend = () => {
  console.log('Starting backend...');
  const backend = spawn('npm', ['run', 'dev'], { 
    cwd: backendDir,
    stdio: 'inherit',
    shell: true 
  });
  
  backend.on('error', (error) => {
    console.error(`Backend start error: ${error.message}`);
  });
  
  return backend;
};

// Main function to restart everything
const restartEverything = async () => {
  console.log('Stopping running processes...');
  
  // Kill processes on common development ports (adjust as needed)
  await killProcessOnPort(5173); // Default Vite port
  await killProcessOnPort(3000); // Common backend port
  
  console.log('Starting all services...');
  
  // Start backend first
  const backendProcess = startBackend();
  
  // Wait a bit before starting frontend
  setTimeout(() => {
    const frontendProcess = startFrontend();
  }, 2000);
};

// Run the restart function
restartEverything(); 