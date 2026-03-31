import { supabase, signInWithGoogle, signOut, getUser } from './auth.js'

// Create and inject the login widget into every page
async function initLoginWidget() {
  try {
    const user = await getUser()

    // Remove existing widget if any
    const existing = document.getElementById('loginWidget')
    if (existing) existing.remove()

    const widget = document.createElement('div')
    widget.id = 'loginWidget'

    if (user) {
      widget.innerHTML = `
        <div class="lw-avatar" id="lwAvatar" onclick="toggleLoginPanel()">
          <img src="${user.user_metadata.avatar_url || user.user_metadata.picture}" alt="avatar">
        </div>
        <div class="lw-panel" id="lwPanel">
          <div class="lw-panel-header">
            <img src="${user.user_metadata.avatar_url || user.user_metadata.picture}" alt="avatar" class="lw-panel-img">
            <div>
              <div class="lw-name">${user.user_metadata.full_name || user.user_metadata.name}</div>
              <div class="lw-email">${user.email}</div>
            </div>
          </div>
          <div class="lw-divider"></div>
          <a href="history.html" class="lw-menu-item">🕓 My History</a>
          <a href="learn.html" class="lw-menu-item">📚 My Streak</a>
          <div class="lw-divider"></div>
          <button class="lw-logout" id="lwLogout">🚪 Logout</button>
        </div>
      `
    } else {
      widget.innerHTML = `
        <button class="lw-login-btn" id="lwLoginBtn">
          <span>🔐</span>
          <span class="lw-login-label">Login</span>
        </button>
      `
    }

    document.body.appendChild(widget)

    // Events
    if (user) {
      const logoutBtn = document.getElementById('lwLogout')
      if (logoutBtn) {
        logoutBtn.onclick = async () => {
          await signOut()
          window.location.reload()
        }
      }
    } else {
      const loginBtn = document.getElementById('lwLoginBtn')
      if (loginBtn) {
        loginBtn.onclick = signInWithGoogle
      }
    }
  } catch (error) {
    console.error('Error initializing login widget:', error)
  }
}

window.toggleLoginPanel = function() {
  const panel = document.getElementById('lwPanel')
  if (panel) {
    panel.classList.toggle('show')
    
    // Close when clicking outside
    if (panel.classList.contains('show')) {
      setTimeout(() => {
        document.addEventListener('click', function handler(e) {
          const widget = document.getElementById('loginWidget')
          if (widget && !widget.contains(e.target)) {
            panel.classList.remove('show')
            document.removeEventListener('click', handler)
          }
        })
      }, 10)
    }
  }
}

// Inject styles if not already present
if (!document.getElementById('loginWidgetStyles')) {
  const style = document.createElement('style')
  style.id = 'loginWidgetStyles'
  style.textContent = `
    #loginWidget {
      position: fixed;
      top: 16px;
      left: 16px;
      z-index: 9999;
    }

    .lw-login-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.95);
      border: 1.5px solid rgba(255,75,110,0.2);
      border-radius: 14px;
      padding: 9px 16px;
      font-family: 'Outfit', sans-serif;
      font-size: 14px;
      font-weight: 700;
      color: #ff4b6e;
      cursor: pointer;
      backdrop-filter: blur(12px);
      box-shadow: 0 4px 16px rgba(255,75,110,0.12);
      transition: all 0.2s ease;
    }
    .lw-login-btn:hover {
      background: rgba(255,75,110,0.06);
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(255,75,110,0.18);
    }

    body.dark .lw-login-btn {
      background: rgba(22,22,31,0.95);
      border-color: rgba(124,131,255,0.25);
      color: #7c83ff;
      box-shadow: 0 4px 16px rgba(124,131,255,0.12);
    }

    .lw-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      cursor: pointer;
      overflow: hidden;
      border: 2.5px solid #ff4b6e;
      box-shadow: 0 4px 14px rgba(255,75,110,0.25);
      transition: all 0.2s ease;
    }
    .lw-avatar:hover { transform: scale(1.05); }
    .lw-avatar img { width: 100%; height: 100%; object-fit: cover; }

    body.dark .lw-avatar { border-color: #7c83ff; }

    .lw-panel {
      display: none;
      position: absolute;
      top: 52px;
      left: 0;
      width: 240px;
      background: rgba(255,255,255,0.97);
      backdrop-filter: blur(20px);
      border: 1.5px solid rgba(255,75,110,0.12);
      border-radius: 18px;
      padding: 16px;
      box-shadow: 0 12px 40px rgba(255,75,110,0.12);
      animation: fadeUp 0.2s ease both;
    }
    .lw-panel.show { display: block; }

    body.dark .lw-panel {
      background: rgba(22,22,31,0.97);
      border-color: rgba(124,131,255,0.15);
      box-shadow: 0 12px 40px rgba(124,131,255,0.1);
    }

    .lw-panel-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .lw-panel-img {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid rgba(255,75,110,0.2);
      flex-shrink: 0;
    }
    body.dark .lw-panel-img { border-color: rgba(124,131,255,0.2); }

    .lw-name {
      font-family: 'Outfit', sans-serif;
      font-size: 14px;
      font-weight: 700;
      color: #1a1a2e;
    }
    body.dark .lw-name { color: #f0f0ff; }

    .lw-email {
      font-size: 11px;
      color: #8a8a9a;
      margin-top: 2px;
      word-break: break-all;
    }

    .lw-divider {
      height: 1px;
      background: rgba(255,75,110,0.08);
      margin: 10px 0;
      border-radius: 99px;
    }
    body.dark .lw-divider { background: rgba(124,131,255,0.1); }

    .lw-menu-item {
      display: block;
      text-decoration: none;
      font-family: 'Outfit', sans-serif;
      font-size: 13.5px;
      font-weight: 600;
      color: #1a1a2e;
      padding: 9px 10px;
      border-radius: 10px;
      transition: all 0.2s ease;
    }
    .lw-menu-item:hover { background: rgba(255,75,110,0.07); color: #ff4b6e; }
    body.dark .lw-menu-item { color: #f0f0ff; }
    body.dark .lw-menu-item:hover { background: rgba(124,131,255,0.1); color: #7c83ff; }

    .lw-logout {
      width: 100%;
      background: rgba(255,75,110,0.07);
      border: 1.5px solid rgba(255,75,110,0.15);
      border-radius: 10px;
      padding: 9px 10px;
      font-family: 'Outfit', sans-serif;
      font-size: 13.5px;
      font-weight: 700;
      color: #ff4b6e;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s ease;
      margin-top: 2px;
    }
    .lw-logout:hover { background: rgba(255,75,110,0.13); }
    body.dark .lw-logout { background: rgba(124,131,255,0.08); border-color: rgba(124,131,255,0.2); color: #7c83ff; }
    body.dark .lw-logout:hover { background: rgba(124,131,255,0.15); }

    .lw-login-label { font-size: 13px; }
    
    @keyframes fadeUp {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `
  document.head.appendChild(style)
}

// Initialize widget immediately
initLoginWidget()

// Listen for auth changes and reinitialize
supabase.auth.onAuthStateChange(() => {
  initLoginWidget()
})