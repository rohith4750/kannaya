
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

let mainWindow = null;
let serverProcess = null;

const PORT = process.env.PORT || 3000;
const PRODUCTION_URL = 'https://www.venkatalaksmi.shop';
const LOCAL_URL = `http://localhost:${PORT}`;

const SERVER_URL = process.env.ELECTRON_START_URL || (app.isPackaged ? PRODUCTION_URL : LOCAL_URL);

// Helper to check if server is responding (supports http and https)
function checkServer(urlStr, callback) {
  const client = urlStr.startsWith('https') ? require('https') : require('http');
  client
    .get(urlStr, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        callback(true);
      } else {
        callback(false);
      }
    })
    .on('error', () => {
      callback(false);
    });
}

// Start Next.js server automatically if not already running
function startLocalServer(onReady) {
  if (SERVER_URL.startsWith('https://')) {
    console.log(`Connecting to production cloud server at ${SERVER_URL}...`);
    onReady();
    return;
  }

  checkServer(SERVER_URL, (running) => {
    if (running) {
      console.log('Next.js server is already running.');
      onReady();
      return;
    }

    const isProd = app.isPackaged || process.env.NODE_ENV === 'production';
    const serverSubCommand = isProd ? 'start' : 'dev';
    console.log(`Starting local Next.js server in ${isProd ? 'PRODUCTION' : 'DEV'} mode...`);

    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    serverProcess = spawn(npxCmd, ['next', serverSubCommand, '-p', PORT], {
      cwd: path.join(__dirname, '..'),
      shell: true,
      env: { ...process.env, NODE_ENV: isProd ? 'production' : 'development' },
    });

    let isReady = false;
    const pollInterval = setInterval(() => {
      checkServer(SERVER_URL, (running) => {
        if (running && !isReady) {
          isReady = true;
          clearInterval(pollInterval);
          onReady();
        }
      });
    }, 1000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 700,
    title: 'SRI VENKATA LAKSHMI ELECTRICALS - ERP Desktop',
    icon: path.join(__dirname, '../public/logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
    autoHideMenuBar: true,
    show: false,
    backgroundColor: '#0f172a',
  });

  // Configure application menu to enable Ctrl+R, F5, Copy/Paste, Zoom shortcuts
  const menuTemplate = [
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', accelerator: 'CmdOrControl+R' },
        { role: 'forceReload', accelerator: 'CmdOrControl+Shift+R' },
        { role: 'toggleDevTools', accelerator: 'F12' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));

  // Explicit shortcut handler for Ctrl+R, F5, and DevTools
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;

    // Ctrl+R, Cmd+R or F5 -> Reload page
    if (((input.control || input.meta) && input.key.toLowerCase() === 'r') || input.key === 'F5') {
      if (input.shift) {
        mainWindow.webContents.reloadIgnoringCache();
      } else {
        mainWindow.webContents.reload();
      }
      event.preventDefault();
    }
    // F12 or Ctrl+Shift+I -> Toggle DevTools
    else if (input.key === 'F12' || ((input.control || input.meta) && input.shift && input.key.toLowerCase() === 'i')) {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  // Splash screen loader HTML
  const loadingHtml = `data:text/html;charset=utf-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Loading ERP Desktop...</title>
        <style>
          body { background: #0f172a; color: white; font-family: system-ui, -apple-system, sans-serif; display: flex; height: 100vh; align-items: center; justify-content: center; margin: 0; flex-direction: column; text-align: center; }
          .logo-box { width: 72px; height: 72px; border-radius: 50%; background: white; padding: 4px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); margin-bottom: 16px; }
          .logo-box img { width: 100%; height: 100%; object-fit: contain; border-radius: 50%; }
          .spinner { width: 36px; height: 36px; border: 3px solid rgba(255,255,255,0.15); border-top-color: #38bdf8; border-radius: 50%; animation: spin 0.8s infinite linear; margin-top: 16px; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          h2 { margin: 8px 0 0; font-size: 18px; font-weight: 700; color: #f8fafc; letter-spacing: 0.5px; }
          p { font-size: 13px; color: #94a3b8; margin: 6px 0 0; }
        </style>
      </head>
      <body>
        <div class="logo-box">
          <img src="logo.png" onerror="this.style.display='none'" />
        </div>
        <h2>Starting Sri Venkata Lakshmi ERP...</h2>
        <p>Initializing local database and application services. Please wait...</p>
        <div class="spinner"></div>
      </body>
    </html>
  `)}`;

  mainWindow.loadURL(loadingHtml);
  mainWindow.maximize();
  mainWindow.show();

  const tryLoadServer = () => {
    checkServer(SERVER_URL, (running) => {
      if (running && mainWindow) {
        mainWindow.loadURL(SERVER_URL);
      } else {
        setTimeout(tryLoadServer, 1000);
      }
    });
  };

  startLocalServer(() => {
    if (mainWindow) {
      mainWindow.loadURL(SERVER_URL);
    }
  });

  // Auto retry on connection failure
  mainWindow.webContents.on('did-fail-load', () => {
    setTimeout(tryLoadServer, 1500);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle window print trigger from renderer
  ipcMain.on('print-window', () => {
    if (mainWindow) {
      mainWindow.webContents.print({
        silent: false,
        printBackground: true,
      });
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch (e) { }
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
