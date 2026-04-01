import {BACKEND_PORT} from './config.js';
import {fileToDataUrl,formatRelativeTime,formatDate,el,generateAvatar} from './helpers.js';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// ─── State ────
const state = {
  token: localStorage.getItem('qanda_token') || null,
  userId: localStorage.getItem('qanda_userId') ? parseInt(localStorage.getItem('qanda_userId')) : null,
  threads: [],
  threadStart: 0,
  currentThreadId: null,
  currentUser: null,
  pollInterval: null,
  watchedThreads: [],
};

// ─── API Helper ───
function apiCall(path, method, body, token, silentOffline) {
  const opts = {
    method: method || 'GET',
    headers: {
      'Content-type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  };
  if (token || state.token) opts.headers['Authorization'] = 'Bearer ' + (token || state.token);
  if (body) opts.body = JSON.stringify(body);

  let url = 'http://localhost:' + BACKEND_PORT + '/' + path;
  if ((method || 'GET') === 'GET') {
    const sep = url.includes('?') ? '&' : '?';
    url += sep + '_=' + Date.now();
  }

  if (!navigator.onLine && !silentOffline) {
    showError('You are offline. Please check your internet connection.');
    return Promise.reject('Offline');
  }

  return fetch(url, opts)
    .then(r => r.json())
    .then(data => {
      if (data && data.error) return Promise.reject(data.error);
      return data;
    });
}

// ─── Database field helpers ────
function likesCount(likes) {
  if (!likes) return 0;
  if (Array.isArray(likes)) return likes.length;
  return Object.keys(likes).length;
}

function isLikedBy(likes, userId) {
  if (!likes) return false;
  const id = parseInt(userId);
  if (Array.isArray(likes)) return likes.some(l => parseInt(l) === id);
  return !!likes[userId] || !!likes[String(userId)] || !!likes[id];
}

function isWatchingThread(user, threadId) {
  if (!user) return false;
  const watched = user.threadsWatching || user.watchedThreads || [];
  const id = parseInt(threadId);
  return watched.some(t => parseInt(t) === id);
}

function isLocked(thread) {
  return thread.lock || thread.isLocked || false;
}

function showError(msg) {
  let container = document.getElementById('error-container');
  if (container) container.remove();
  container = el('div', {id: 'error-container'});
  const p = el('p', {}, String(msg));
  const closeBtn = el('button', {id: 'error-close', textContent: '✕'});
  closeBtn.addEventListener('click', () => container.remove());
  container.appendChild(p);
  container.appendChild(closeBtn);
  document.body.appendChild(container);
  setTimeout(() => { if (container.parentNode) container.remove(); }, 5000);
}

// ─── Routing / Screens ────
function clearMain() {
  const main = document.querySelector('main');
  while (main.firstChild) main.removeChild(main.firstChild);
  return main;
}

// ─── AUTH ────
function showAuthPage(showRegister) {
  stopPolling();
  const main = clearMain();
  updateHeader(false);
  const page = el('div', {id: 'auth-page'});
  const card = el('div', {className: 'auth-card'});
  page.appendChild(card);
  main.appendChild(page);
  if (showRegister) renderRegisterForm(card);
  else renderLoginForm(card);
}

function renderLoginForm(card) {
  while (card.firstChild) card.removeChild(card.firstChild);
  card.appendChild(el('h2', {}, 'Welcome back'));
  card.appendChild(el('p', {className: 'subtitle'}, 'Sign in to your Qanda account'));

  const emailGroup = el('div', {className: 'form-group'});
  emailGroup.appendChild(el('label', {textContent: 'Email'}));
  const emailInput = el('input', {type: 'text', id: 'login-email', placeholder: 'you@example.com'});
  emailGroup.appendChild(emailInput);
  card.appendChild(emailGroup);

  const passGroup = el('div', {className: 'form-group'});
  passGroup.appendChild(el('label', {textContent: 'Password'}));
  const passInput = el('input', {type: 'password', id: 'login-password', placeholder: '••••••••'});
  passGroup.appendChild(passInput);
  card.appendChild(passGroup);

  const submitBtn = el('button', {
    id: 'login-submit',
    className: 'btn-primary btn-primary-full',
    textContent: 'Sign In',
  });
  card.appendChild(submitBtn);

  const regRow = el('div', {className: 'auth-footer-row'});
  regRow.appendChild(document.createTextNode("Don't have an account? "));
  const regLink = el('button', {id: 'register-link', className: 'auth-link', textContent: 'Register'});
  regRow.appendChild(regLink);
  card.appendChild(regRow);

    submitBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const password = passInput.value;
    if (!email || !password) { showError('Please fill in all fields.'); return; }
    apiCall('auth/login', 'POST', {email, password}, null)
      .then(data => {
        state.token = data.token;
        state.userId = data.userId;
        localStorage.setItem('qanda_token', data.token);
        localStorage.setItem('qanda_userId', data.userId);
        loadDashboard();
      })
      .catch(showError);
  });
  regLink.addEventListener('click', () => showAuthPage(true));
}

function renderRegisterForm(card) {
  while (card.firstChild) card.removeChild(card.firstChild);
  card.appendChild(el('h2', {}, 'Create account'));
  card.appendChild(el('p', {className: 'subtitle'}, 'Join Qanda and start discussing'));

  const fields = [
    {label: 'Email', id: 'register-email', type: 'text', placeholder: 'you@example.com'},
    {label: 'Name', id: 'register-name', type: 'text', placeholder: 'Your name'},
    {label: 'Password', id: 'register-password', type: 'password', placeholder: '••••••••'},
    {label: 'Confirm Password', id: 'register-confirm-password', type: 'password', placeholder: '••••••••'},
  ];

  fields.forEach(f => {
    const group = el('div', {className: 'form-group'});
    group.appendChild(el('label', {textContent: f.label}));
    group.appendChild(el('input', {type: f.type, id: f.id, placeholder: f.placeholder}));
    card.appendChild(group);
  });

  const submitBtn = el('button', {
    id: 'register-submit',
    className: 'btn-primary btn-primary-full',
    textContent: 'Create Account',
  });
  card.appendChild(submitBtn);

  const loginRow = el('div', {className: 'auth-footer-row'});
  loginRow.appendChild(document.createTextNode('Already have an account? '));
  const loginLink = el('button', {className: 'auth-link', textContent: 'Sign in'});
  loginRow.appendChild(loginLink);
  card.appendChild(loginRow);

  submitBtn.addEventListener('click', () => {
    const email = document.getElementById('register-email').value.trim();
    const name = document.getElementById('register-name').value.trim();
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm-password').value;
    if (!email || !name || !password) { showError('Please fill in all fields.'); return; }
    if (password !== confirm) { showError('Passwords do not match.'); return; }

    apiCall('auth/register', 'POST', {email, name, password}, null)
      .then(data => {
        state.token = data.token;
        state.userId = data.userId;
        localStorage.setItem('qanda_token', data.token);
        localStorage.setItem('qanda_userId', data.userId);
        loadDashboard();
      })
      .catch(showError);
  });
  loginLink.addEventListener('click', () => showAuthPage(false));
}

// ─── HEADER ────
function updateHeader(loggedIn) {
  const header = document.getElementById('app-header');
  while (header.firstChild) header.removeChild(header.firstChild);

  const logo = el('div', {
    className: 'header-logo',
    title: loggedIn ? 'Go to homepage' : '',
  });
  logo.appendChild(document.createTextNode('Q'));
  logo.appendChild(el('span', {textContent: '&'}));
  logo.appendChild(document.createTextNode('A'));
  logo.appendChild(el('span', {className: 'header-logo-sub', textContent: 'qanda'}));

    if (loggedIn) {
    logo.classList.add('header-logo-clickable');
    logo.addEventListener('click', () => {
      state.currentThreadId = null;
      state.threads = [];
      state.threadStart = 0;
      state.allThreadData = [];
      history.pushState(null, '', '/#dashboard');
      loadDashboard();
    });
  }
  header.appendChild(logo);

  const actions = el('div', {className: 'header-actions'});
  header.appendChild(actions);

  if (loggedIn) {
    const createBtn = el('button', {id: 'create-thread-button', className: 'btn-primary', textContent: '+ Create'});
    createBtn.addEventListener('click', showCreateThread);
    actions.appendChild(createBtn);

    const themeBtn = el('button', {className: 'btn-icon', title: 'Toggle theme'});
    themeBtn.textContent = document.body.classList.contains('light') ? '🌙' : '☀️';
    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('light');
      const isLight = document.body.classList.contains('light');
      localStorage.setItem('qanda_theme', isLight ? 'light' : 'dark');
      themeBtn.textContent = isLight ? '🌙' : '☀️';
    });
    actions.appendChild(themeBtn);

        const avatarLabel = el('div', {id: 'avatar-label'});
    const avatarImg = el('img', {
      src: generateAvatar(state.currentUser ? state.currentUser.name : '?'),
      alt: 'Profile',
    });
    avatarLabel.appendChild(avatarImg);
    avatarLabel.appendChild(el('span', {textContent: state.currentUser ? state.currentUser.name : 'Profile'}));
    avatarLabel.addEventListener('click', () => showProfile(state.userId));
    actions.appendChild(avatarLabel);

    const logoutBtn = el('button', {id: 'logout-button', className: 'btn-ghost', textContent: 'Logout'});
    logoutBtn.addEventListener('click', doLogout);
    actions.appendChild(logoutBtn);
  }
}

function doLogout() {
  state.token = null;
  state.userId = null;
  state.currentUser = null;
  state.currentThreadId = null;
  localStorage.removeItem('qanda_token');
  localStorage.removeItem('qanda_userId');
  stopPolling();
  showAuthPage(false);
}

// ─── DASHBOARD ─────
function loadDashboard() {
  apiCall('user?userId=' + state.userId, 'GET')
    .then(user => {
      state.currentUser = user;
      renderDashboard();
    })
    .catch(() => renderDashboard());
}

function renderDashboard() {
  const main = clearMain();
  updateHeader(true);

  if (!window.location.hash || window.location.hash === '#') {
    history.replaceState(null, '', '/#dashboard');
  }

  const dashboard = el('div', {id: 'dashboard-container'});
  main.appendChild(dashboard);

  state.threads = [];
  state.threadStart = 0;
  state.allThreadData = [];
  state.totalThreadCount = 0;

  const sidebar = el('div', {id: 'thread-list-container'});
  const listHeader = el('div', {className: 'thread-list-header'});
  listHeader.appendChild(document.createTextNode('Threads'));
  const threadCountBadge = el('span', {
    id: 'thread-count-badge',
    className: 'thread-count-badge',
    textContent: '0',
  });
  listHeader.appendChild(threadCountBadge);
  sidebar.appendChild(listHeader);

  const searchWrapper = el('div', {className: 'sidebar-search-wrapper'});
  const searchInput = el('input', {
    type: 'text',
    placeholder: '🔍 Search threads...',
  });
  searchWrapper.appendChild(searchInput);
  sidebar.appendChild(searchWrapper);

  const sortWrapper = el('div', {className: 'sidebar-sort-wrapper'});
  sortWrapper.appendChild(el('span', {className: 'sidebar-sort-label'}, 'Sort:'));
  const sortSelect = el('select', {className: 'sidebar-sort-select'});
  const sortOptions = [
    {value: 'newest', label: 'Newest'},
    {value: 'likes', label: 'Most Liked'},
    {value: 'comments', label: 'Most Comments'},
  ];
  sortOptions.forEach(opt => sortSelect.appendChild(el('option', {value: opt.value, textContent: opt.label})));
  sortWrapper.appendChild(sortSelect);
  sidebar.appendChild(sortWrapper);

  const threadItemsContainer = el('div', {id: 'thread-items-container'});
  sidebar.appendChild(threadItemsContainer);
  dashboard.appendChild(sidebar);

  const content = el('div', {className: 'main-content', id: 'main-content-area'});
  const empty = el('div', {className: 'empty-state'});
  empty.appendChild(el('p', {}, 'Select a thread to start reading'));
  content.appendChild(empty);
  dashboard.appendChild(content);

  state.allThreadData = [];

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    applySidebarFilter(threadItemsContainer, query, sortSelect.value);
  });

  sortSelect.addEventListener('change', () => {
    const query = searchInput.value.trim().toLowerCase();
    const sortBy = sortSelect.value;

    if (sortBy === 'newest') {
      applySidebarFilter(threadItemsContainer, query, sortBy);
      return;
    }

    const loadingMsg = el('div', {className: 'sidebar-loading-msg'}, '⟳ loading all threads...');
    while (threadItemsContainer.firstChild) threadItemsContainer.removeChild(threadItemsContainer.firstChild);
    threadItemsContainer.appendChild(loadingMsg);

    const oldMore = document.getElementById('list-more-button');
    if (oldMore) oldMore.remove();

    fetchAllThreads(0, []).then(allIds => {
      const existingIds = state.allThreadData.map(t => t.id);
      const missingIds = allIds.filter(id => !existingIds.includes(parseInt(id)));

      const fetchMissing = missingIds.map(id =>
        apiCall('thread?id=' + id, 'GET')
          .then(thread =>
            apiCall('user?userId=' + thread.creatorId, 'GET')
              .then(u => { thread.authorName = u.name; return thread; })
              .catch(() => { thread.authorName = 'user #' + thread.creatorId; return thread; })
          )
          .then(thread =>
            apiCall('comments?threadId=' + thread.id, 'GET', null, null, true)
              .then(d => {
                thread.commentCount = Array.isArray(d) ? d.length : (d.comments || []).length;
                return thread;
              })
              .catch(() => { thread.commentCount = 0; return thread; })
          )
          .then(thread => {
            state.allThreadData = state.allThreadData.filter(t => t.id !== thread.id);
            state.allThreadData.push(thread);
          })
          .catch(() => {})
      );

      return Promise.all(fetchMissing);
    }).then(() => {
      loadingMsg.remove();
      const badge = document.getElementById('thread-count-badge');
      if (badge) badge.textContent = state.allThreadData.length;
      applySidebarFilter(threadItemsContainer, query, sortBy);
    }).catch(() => {
      loadingMsg.remove();
      applySidebarFilter(threadItemsContainer, query, sortBy);
    });
  });

  const content = el('div', {className: 'main-content', id: 'main-content-area'});
  const empty = el('div', {className: 'empty-state'});
  empty.appendChild(el('p', {}, 'Select a thread to start reading'));
  content.appendChild(empty);
  dashboard.appendChild(content);

  handleHashRouting();
  loadThreads(sidebar, true);

  fetchAllThreads(0, []).then(allIds => {
    state.totalThreadCount = allIds.length;
    const badge = document.getElementById('thread-count-badge');
    if (badge) badge.textContent = state.totalThreadCount;
  }).catch(() => {});
}

function applySidebarFilter(container, query, sortBy) {
  if (!state.allThreadData) return;
  let filtered = state.allThreadData.slice();
  if (query) {
    filtered = filtered.filter(t => t.title.toLowerCase().includes(query));
  }
  if (sortBy === 'likes') {
    filtered.sort((a, b) => likesCount(b.likes) - likesCount(a.likes));
  } else if (sortBy === 'comments') {
    filtered.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
  } else {
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

    while (container.firstChild) container.removeChild(container.firstChild);
  filtered.forEach(thread => {
    container.appendChild(buildThreadCard(thread));
  });

  if (state.currentThreadId) {
    const active = container.querySelector('[data-thread-id="' + state.currentThreadId + '"]');
    if (active) active.classList.add('active');
  }
}

function buildThreadCard(thread) {
  const item = el('div', {className: 'list-thread-container'});
  item.dataset.threadId = thread.id;
  if (thread.id === state.currentThreadId) item.classList.add('active');

  const titleRow = el('div', {className: 'thread-card-title-row'});
  titleRow.appendChild(el('div', {className: 'list-thread-title', textContent: thread.title}));
  if (!thread.isPublic) titleRow.appendChild(el('span', {className: 'private-badge', textContent: 'private'}));
  item.appendChild(titleRow);

  const meta = el('div', {className: 'list-thread-meta'});
  meta.appendChild(el('span', {className: 'list-thread-date', textContent: formatDate(thread.createdAt)}));
  meta.appendChild(el('span', {className: 'dot', textContent: '·'}));
  const authorSpan = el('span', {className: 'list-thread-author', textContent: thread.authorName || '...'});
  meta.appendChild(authorSpan);
  meta.appendChild(el('span', {className: 'dot', textContent: '·'}));
  meta.appendChild(el('span', {className: 'list-thread-likes', textContent: '♥ ' + likesCount(thread.likes)}));
  meta.appendChild(el('span', {className: 'dot', textContent: '·'}));
  meta.appendChild(el('span', {className: 'list-comment-likes', textContent: '💬 ' + (thread.commentCount || 0)}));
  item.appendChild(meta);

  item.addEventListener('click', () => showThread(thread.id));
  return item;
}

// Fetch ALL thread IDs by paginating through every page
function fetchAllThreads(start, accumulated) {
  return apiCall('threads?start=' + start, 'GET')
    .then(data => {
      let ids = Array.isArray(data) ? data : (data.threads || []);
      ids = ids.filter(id => typeof id === 'number' || (typeof id === 'string' && !isNaN(id)));
      const all = accumulated.concat(ids);
      if (ids.length === 5) return fetchAllThreads(start + 5, all);
      return all;
    })
    .catch(() => accumulated);
}

function loadThreads(sidebar, initial) {
  const itemsContainer = document.getElementById('thread-items-container') || sidebar;

  const oldMore = document.getElementById('list-more-button');
  if (oldMore) oldMore.remove();
  const oldSentinel = document.getElementById('infinite-scroll-sentinel');
  if (oldSentinel) oldSentinel.remove();

  return apiCall('threads?start=' + state.threadStart, 'GET')
    .then(data => {
      let threadIds = Array.isArray(data) ? data : (data.threads || []);
      threadIds = threadIds.filter(id => typeof id === 'number' || (typeof id === 'string' && !isNaN(id)));

      const detailPromises = threadIds.map(threadId => {
        state.threads.push(threadId);
        return apiCall('thread?id=' + threadId, 'GET')
          .then(thread => {
            return apiCall('user?userId=' + thread.creatorId, 'GET')
              .then(u => { thread.authorName = u.name; return thread; })
              .catch(() => { thread.authorName = 'User ' + thread.creatorId; return thread; });
          })
          .then(thread => {
            return apiCall('comments?threadId=' + thread.id, 'GET', null, null, true)
              .then(d => {
                thread.commentCount = Array.isArray(d) ? d.length : (d.comments || []).length;
                return thread;
              })
              .catch(() => { thread.commentCount = 0; return thread; });
          })
          .then(thread => {
            if (!state.allThreadData) state.allThreadData = [];
            state.allThreadData = state.allThreadData.filter(t => t.id !== thread.id);
            state.allThreadData.push(thread);

            const searchInput = document.querySelector('#thread-list-container input[type="text"]');
            const sortSelectEl = document.querySelector('#thread-list-container select');
            applySidebarFilter(
              itemsContainer,
              searchInput ? searchInput.value.trim().toLowerCase() : '',
              sortSelectEl ? sortSelectEl.value : 'newest'
            );
          });
      });

      Promise.all(detailPromises).then(() => {
        const currentLoader = document.getElementById('infinite-scroll-loader');
        if (currentLoader) currentLoader.remove();
        if (threadIds.length > 0) {
          const moreButton = el('button', {
            id: 'list-more-button',
//            textContent: 'Load More',
          });
          sidebar.appendChild(moreButton);

          const sentinel = el('div', {
            id: 'infinite-scroll-sentinel',
            className: 'infinite-scroll-sentinel',
          });
          sidebar.appendChild(sentinel);

          const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
              observer.disconnect();
              sentinel.remove();

              const loader = el('div', {
                id: 'infinite-scroll-loader',
                className: 'infinite-scroll-loader',
                textContent: '⟳ Loading more threads...',
              });
              sidebar.appendChild(loader);

              sleep(1000).then(() => {
                state.threadStart += threadIds.length;
                loadThreads(sidebar, false);
              });
            }
          }, {
            root: sidebar,
            threshold: 0.1,
          });

          observer.observe(sentinel);
        }
      });

      if (initial && threadIds.length > 0 && !state.currentThreadId) {
        showThread(threadIds[0], true);
      }
    })
    .catch(showError);
}

// ─── THREAD VIEW ─────
function showThread(threadId, silent, pushHistory) {
  if (!threadId) {
    if (!silent) showError('Invalid thread ID.');
    return;
  }
  state.currentThreadId = threadId;
  if (pushHistory !== false) history.pushState(null, '', '/#thread=' + threadId);

  document.querySelectorAll('.list-thread-container').forEach(item => {
    item.classList.toggle('active', item.dataset.threadId == threadId);
  });

  const contentArea = document.getElementById('main-content-area');
  if (!contentArea) return;

  while (contentArea.firstChild) contentArea.removeChild(contentArea.firstChild);
  const spinnerWrapper = el('div', {className: 'spinner-wrapper'});
  spinnerWrapper.appendChild(el('div', {className: 'spinner'}));
  contentArea.appendChild(spinnerWrapper);

  apiCall('thread?id=' + threadId, 'GET')
    .then(thread => {
      while (contentArea.firstChild) contentArea.removeChild(contentArea.firstChild);
      try { localStorage.setItem('qanda_cached_thread', JSON.stringify(thread)); } catch (e) {}
      renderThread(contentArea, thread);
      startPolling(threadId);
    })
    .catch(err => {
      while (contentArea.firstChild) contentArea.removeChild(contentArea.firstChild);
      if (!navigator.onLine) {
        try {
          const cached = JSON.parse(localStorage.getItem('qanda_cached_thread'));
          if (cached) {
            const offlineBanner = el('div', {className: 'locked-notice'}, '⚠️ You are offline. Showing cached thread.');
            contentArea.appendChild(offlineBanner);
            renderThread(contentArea, cached);
            return;
          }
        } catch (e) {}
      }
      if (!silent) showError(err);
    });
}

function renderThread(container, thread) {
  const isOwnerOrAdmin = state.currentUser && (state.currentUser.admin || thread.creatorId === state.userId);
  const isLikedThread = isLikedBy(thread.likes, state.userId);
  const isWatched = isWatchingThread(state.currentUser, thread.id);

  const wrapper = el('div', {id: 'thread-container'});

  const titleRow = el('div', {className: 'thread-title-row'});
  titleRow.appendChild(el('h1', {id: 'thread-title', textContent: thread.title}));
  if (!thread.isPublic) titleRow.appendChild(el('span', {className: 'private-badge', textContent: 'private'}));
  if (isLocked(thread)) {
    wrapper.appendChild(el('div', {className: 'locked-notice'}, '🔒 This thread is locked'));
  }
  wrapper.appendChild(titleRow);

  const metaRow = el('div', {className: 'thread-header-meta'});
  const authorLink = el('span', {id: 'thread-author', textContent: 'Loading...'});
  apiCall('user?userId=' + thread.creatorId, 'GET')
    .then(u => {
      authorLink.textContent = 'by ' + u.name;
      authorLink.addEventListener('click', () => showProfile(thread.creatorId));
    })
    .catch(() => { authorLink.textContent = 'by user #' + thread.creatorId; });
  metaRow.appendChild(authorLink);
  metaRow.appendChild(el('span', {className: 'dot', textContent: '·'}));
  metaRow.appendChild(el('span', {className: 'thread-header-date', textContent: formatDate(thread.createdAt)}));
  wrapper.appendChild(metaRow);

  wrapper.appendChild(el('div', {id: 'thread-body', textContent: thread.content}));

  const actions = el('div', {className: 'thread-actions'});

  const likesSpan = el('span', {id: 'thread-likes', textContent: '♥ ' + likesCount(thread.likes) + ' likes'});
  actions.appendChild(likesSpan);

  if (!isLocked(thread)) {
    const likeBtn = el('button', {id: 'thread-like-toggle', className: isLikedThread ? 'liked' : ''});
    likeBtn.textContent = isLikedThread ? '♥ Unlike' : '♡ Like';
    likeBtn.addEventListener('click', () => toggleLikeThread(thread, likeBtn, likesSpan));
    actions.appendChild(likeBtn);
  }

  const watchBtn = el('button', {id: 'thread-watch-toggle', className: isWatched ? 'watching' : ''});
  watchBtn.textContent = isWatched ? '👁 Watching' : '👁 Watch';
  watchBtn.addEventListener('click', () => toggleWatchThread(thread, watchBtn));
  actions.appendChild(watchBtn);

  if (isOwnerOrAdmin) {
    if (!isLocked(thread)) {
      const editBtn = el('button', {id: 'thread-edit-button', className: 'btn-ghost', textContent: '✎ Edit'});
      editBtn.addEventListener('click', () => showEditThread(thread));
      actions.appendChild(editBtn);
    }

    const deleteBtn = el('button', {id: 'thread-delete-button', className: 'btn-danger', textContent: '🗑 Delete'});
    deleteBtn.addEventListener('click', () => deleteThread(thread.id));
    actions.appendChild(deleteBtn);
  }

  wrapper.appendChild(actions);

  const commentSection = el('div', {id: 'comment-list-container'});
  wrapper.appendChild(commentSection);
  container.appendChild(wrapper);

  loadComments(thread, commentSection);
}

function toggleLikeThread(thread, btn, likesSpan) {
  const currentlyLiked = btn.classList.contains('liked');
  apiCall('thread/like', 'PUT', {id: thread.id, turnon: !currentlyLiked})
    .then(() => {
      btn.classList.toggle('liked', !currentlyLiked);
      btn.textContent = !currentlyLiked ? '♥ Unlike' : '♡ Like';
      const delta = currentlyLiked ? -1 : 1;
      const match = likesSpan.textContent.match(/\d+/);
      const count = match ? parseInt(match[0]) + delta : delta;
      likesSpan.textContent = '♥ ' + Math.max(0, count) + ' likes';
    })
    .catch(showError);
}

function toggleWatchThread(thread, btn) {
  const currentlyWatching = btn.classList.contains('watching');
  apiCall('thread/watch', 'PUT', {id: thread.id, turnon: !currentlyWatching})
    .then(() => {
      btn.classList.toggle('watching', !currentlyWatching);
      btn.textContent = !currentlyWatching ? '👁 Watching' : '👁 Watch';
      if (state.currentUser) {
        if (!currentlyWatching) {
          if (!state.currentUser.threadsWatching) state.currentUser.threadsWatching = [];
          state.currentUser.threadsWatching.push(thread.id);
        } else {
          state.currentUser.threadsWatching = (state.currentUser.threadsWatching || []).filter(id => id !== thread.id);
        }
      }
    })
    .catch(showError);
}

function deleteThread(threadId) {
  if (!confirm('Delete this thread?')) return;
  apiCall('thread', 'DELETE', {id: threadId})
    .then(() => {
      state.currentThreadId = null;
      history.pushState(null, '', '/#dashboard');
      state.totalThreadCount = Math.max(0, (state.totalThreadCount || 1) - 1);
      const badge = document.getElementById('thread-count-badge');
      if (badge) badge.textContent = state.totalThreadCount;
      state.allThreadData = (state.allThreadData || []).filter(t => t.id !== threadId);
      const item = document.querySelector('[data-thread-id="' + threadId + '"]');
      if (item) item.remove();
      const firstItem = document.querySelector('.list-thread-container');
      if (firstItem) {
        showThread(parseInt(firstItem.dataset.threadId));
      } else {
        const content = document.getElementById('main-content-area');
        if (content) {
          while (content.firstChild) content.removeChild(content.firstChild);
          content.appendChild(el('div', {className: 'empty-state'}, 'No threads yet. Create one!'));
        }
      }
    })
    .catch(showError);
}

// ─── CREATE THREAD ────────────────────────────────────────────────────────────
function showCreateThread() {
  state.currentThreadId = null;
  history.pushState(null, '', '/#create');

  let contentArea = document.getElementById('main-content-area');
  if (!contentArea) {
    renderDashboard();
    contentArea = document.getElementById('main-content-area');
  }

  while (contentArea.firstChild) contentArea.removeChild(contentArea.firstChild);

  const page = el('div', {id: 'create-thread-page'});
  contentArea.appendChild(page);

  page.appendChild(el('h2', {className: 'page-title'}, 'Create Thread'));

  const titleGroup = el('div', {className: 'form-group'});
  titleGroup.appendChild(el('label', {textContent: 'Title'}));
  const titleInput = el('input', {type: 'text', id: 'create-thread-title', placeholder: 'Thread title...'});
  titleGroup.appendChild(titleInput);
  page.appendChild(titleGroup);

  const bodyGroup = el('div', {className: 'form-group'});
  bodyGroup.appendChild(el('label', {textContent: 'Content'}));
  const bodyArea = el('textarea', {id: 'create-thread-body', placeholder: 'Write something...'});
  bodyGroup.appendChild(bodyArea);
  page.appendChild(bodyGroup);

  const privRow = el('div', {className: 'form-row form-group'});
  const privCheck = el('input', {type: 'checkbox', id: 'create-thread-private'});
  privRow.appendChild(privCheck);
  privRow.appendChild(el('label', {textContent: 'Private thread'}));
  page.appendChild(privRow);

  const btnRow = el('div', {className: 'form-btn-row'});
  const submitBtn = el('button', {id: 'create-thread-submit', className: 'btn-primary', textContent: 'Publish Thread'});
  const cancelBtn = el('button', {className: 'btn-ghost', textContent: 'Cancel'});
  btnRow.appendChild(submitBtn);
  btnRow.appendChild(cancelBtn);
  page.appendChild(btnRow);

  cancelBtn.addEventListener('click', loadDashboard);

  submitBtn.addEventListener('click', () => {
    const title = titleInput.value.trim();
    const content = bodyArea.value.trim();
    const isPrivate = privCheck.checked;
    if (!title || !content) { showError('Title and content are required.'); return; }
    apiCall('thread', 'POST', {title, content, isPublic: !isPrivate})
      .then(data => {
        const newId = data.id;
        if (!newId) { showError('Thread created but ID missing.'); return; }
        state.totalThreadCount = (state.totalThreadCount || 0) + 1;
        const badge = document.getElementById('thread-count-badge');
        if (badge) badge.textContent = state.totalThreadCount;
        state.currentThreadId = newId;
        if (!document.getElementById('main-content-area')) {
          renderDashboard();
        }
        showThread(newId, true);
      })
      .catch(showError);
  });
}

// ─── EDIT THREAD ──────────────────────────────────────────────────────────────
function showEditThread(thread) {
  const contentArea = document.getElementById('main-content-area');
  if (!contentArea) return;
  while (contentArea.firstChild) contentArea.removeChild(contentArea.firstChild);

  const page = el('div', {id: 'edit-thread-container'});
  contentArea.appendChild(page);

  page.appendChild(el('h2', {className: 'page-title'}, 'Edit Thread'));

  const titleGroup = el('div', {className: 'form-group'});
  titleGroup.appendChild(el('label', {textContent: 'Title'}));
  const titleInput = el('input', {type: 'text', id: 'edit-thread-title', value: thread.title});
  titleGroup.appendChild(titleInput);
  page.appendChild(titleGroup);

  const bodyGroup = el('div', {className: 'form-group'});
  bodyGroup.appendChild(el('label', {textContent: 'Content'}));
  const bodyArea = el('textarea', {id: 'edit-thread-body'});
  bodyArea.textContent = thread.content;
  bodyGroup.appendChild(bodyArea);
  page.appendChild(bodyGroup);

  const privRow = el('div', {className: 'form-row form-group'});
  const privCheck = el('input', {type: 'checkbox', id: 'edit-thread-private', checked: !thread.isPublic});
  privRow.appendChild(privCheck);
  privRow.appendChild(el('label', {textContent: 'Private thread'}));
  page.appendChild(privRow);

  const lockRow = el('div', {className: 'form-row form-group'});
  const lockCheck = el('input', {type: 'checkbox', id: 'edit-thread-locked', checked: isLocked(thread)});
  lockRow.appendChild(lockCheck);
  lockRow.appendChild(el('label', {textContent: 'Locked thread'}));
  page.appendChild(lockRow);

  const btnRow = el('div', {className: 'form-btn-row'});
  const submitBtn = el('button', {id: 'edit-thread-submit', className: 'btn-primary', textContent: 'Save Changes'});
  const cancelBtn = el('button', {className: 'btn-ghost', textContent: 'Cancel'});
  btnRow.appendChild(submitBtn);
  btnRow.appendChild(cancelBtn);
  page.appendChild(btnRow);

  cancelBtn.addEventListener('click', () => showThread(thread.id));

  submitBtn.addEventListener('click', () => {
    const title = titleInput.value.trim();
    const content = bodyArea.value.trim();
    const isPrivate = privCheck.checked;
    const lock = lockCheck.checked;
    if (!title || !content) { showError('Title and content are required.'); return; }
    apiCall('thread', 'PUT', {id: thread.id, title, content, isPublic: !isPrivate, lock})
      .then(() => {
        const item = document.querySelector('[data-thread-id="' + thread.id + '"]');
        if (item) {
          const titleEl = item.querySelector('.list-thread-title');
          if (titleEl) titleEl.textContent = title;
        }
        showThread(thread.id);
      })
      .catch(showError);
  });
}

// ─── COMMENTS ─────────────────────────────────────────────────────────────────
function loadComments(thread, container) {
  while (container.firstChild) container.removeChild(container.firstChild);

  apiCall('comments?threadId=' + thread.id, 'GET')
    .then(data => {
      const comments = Array.isArray(data) ? data : (data.comments || []);
      renderComments(thread, container, comments);
    })
    .catch(() => { container.appendChild(el('p', {}, 'Could not load comments.')); });
}

function renderComments(thread, container, allComments) {
  container.appendChild(el('h3', {className: 'comments-heading'}, allComments.length + ' Comment' + (allComments.length !== 1 ? 's' : '')));

  const topLevel = allComments.filter(c => !c.parentCommentId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (!isLocked(thread)) {
    container.appendChild(buildCommentInput(thread, allComments, container));
  } else {
    container.appendChild(el('div', {className: 'locked-notice'}, '🔒 Comments are disabled for locked threads'));
  }

  if (topLevel.length === 0 && isLocked(thread)) return;

  topLevel.forEach(c => {
    container.appendChild(buildCommentEl(c, allComments, thread, 0));
  });
}

function buildCommentEl(comment, allComments, thread, depth) {
  const wrapper = el('div', {});
  const item = el('div', {className: 'list-comment-container'});

  const header = el('div', {className: 'comment-header'});
  const avatar = el('img', {className: 'list-comment-profile', alt: 'avatar'});
  avatar.src = generateAvatar('?');
  header.appendChild(avatar);

  apiCall('user?userId=' + comment.creatorId, 'GET')
    .then(u => {
      avatar.src = u.image || generateAvatar(u.name);
      const nameEl = item.querySelector('.list-comment-author');
      if (nameEl) nameEl.textContent = u.name;
    })
    .catch(() => {});

  const meta = el('div', {className: 'comment-meta'});
  const authorEl = el('span', {className: 'list-comment-author comment-author-link', textContent: 'User #' + comment.creatorId});
  authorEl.addEventListener('click', () => showProfile(comment.creatorId));
  meta.appendChild(authorEl);
  meta.appendChild(el('div', {className: 'list-comment-date', textContent: formatRelativeTime(comment.createdAt)}));
  header.appendChild(meta);
  item.appendChild(header);

  item.appendChild(el('div', {className: 'list-comment-body', textContent: comment.content}));

  const footer = el('div', {className: 'comment-footer'});
  const isLikedComment = isLikedBy(comment.likes, state.userId);
  const likeCount = likesCount(comment.likes);
  const likesSpan = el('span', {className: 'list-comment-likes', textContent: '♥ ' + likeCount});
  footer.appendChild(likesSpan);

  const likeBtn = el('button', {
    className: 'thread-like-button' + (isLikedComment ? ' liked' : ''),
    textContent: isLikedComment ? 'unlike' : 'like',
  });
  likeBtn.addEventListener('click', () => {
    const currentlyLiked = likeBtn.classList.contains('liked');
    apiCall('comment/like', 'PUT', {id: comment.id, turnon: !currentlyLiked})
      .then(() => {
        likeBtn.classList.toggle('liked', !currentlyLiked);
        likeBtn.textContent = !currentlyLiked ? 'unlike' : 'like';
        const match = likesSpan.textContent.match(/\d+/);
        const count = match ? parseInt(match[0]) + (!currentlyLiked ? 1 : -1) : 0;
        likesSpan.textContent = '♥ ' + Math.max(0, count);
      })
      .catch(showError);
  });
  footer.appendChild(likeBtn);

  if (!isLocked(thread)) {
    const replyBtn = el('button', {className: 'thread-reply-button', textContent: 'reply'});
    replyBtn.addEventListener('click', () => showReplyModal(comment, thread, allComments, item));
    footer.appendChild(replyBtn);
  }

  if (state.currentUser && (state.currentUser.admin || comment.creatorId === state.userId)) {
    const editBtn = el('button', {className: 'comment-edit-button', textContent: 'edit'});
    editBtn.addEventListener('click', () => showEditCommentModal(comment, thread));
    footer.appendChild(editBtn);
  }
  item.appendChild(footer);
  wrapper.appendChild(item);

  const children = allComments
    .filter(c => c.parentCommentId === comment.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (children.length > 0) {
    const nested = el('div', {className: 'nested-comments'});
    children.forEach(child => nested.appendChild(buildCommentEl(child, allComments, thread, depth + 1)));
    wrapper.appendChild(nested);
  }

  return wrapper;
}

function buildCommentInput(thread, allComments, container) {
  const inputWrapper = el('div', {className: 'comment-input-wrapper'});
  const textarea = el('textarea', {id: 'thread-comment-text', placeholder: 'Write a comment...'});
  inputWrapper.appendChild(textarea);

  const submitBtn = el('button', {id: 'thread-comment-submit', className: 'btn-primary', textContent: 'Comment'});
  submitBtn.addEventListener('click', () => {
    const content = textarea.value.trim();
    if (!content) { showError('Comment cannot be empty.'); return; }
    apiCall('comment', 'POST', {threadId: thread.id, content, parentCommentId: null})
      .then(() => {
        textarea.value = '';
        loadComments(thread, container);
      })
      .catch(showError);
  });
  inputWrapper.appendChild(submitBtn);
  return inputWrapper;
}

function showReplyModal(parentComment, thread, allComments, commentEl) {
  const overlay = el('div', {className: 'modal-overlay', id: 'thread-reply-container'});
  const box = el('div', {className: 'modal-box'});

  const header = el('div', {className: 'modal-header'});
  header.appendChild(el('h3', {}, 'Reply to comment'));
  const closeBtn = el('button', {className: 'modal-close', textContent: '✕'});
  closeBtn.addEventListener('click', () => overlay.remove());
  header.appendChild(closeBtn);
  box.appendChild(header);

  const textarea = el('textarea', {id: 'thread-reply-text', placeholder: 'Write a reply...'});
  box.appendChild(textarea);

  const submitBtn = el('button', {
    id: 'thread-reply-submit',
    className: 'btn-primary modal-submit',
    textContent: 'Comment',
  });
  submitBtn.addEventListener('click', () => {
    const content = textarea.value.trim();
    if (!content) { showError('Reply cannot be empty.'); return; }
    apiCall('comment', 'POST', {threadId: thread.id, content, parentCommentId: parentComment.id})
      .then(() => {
        overlay.remove();
        const section = document.getElementById('comment-list-container');
        if (section) loadComments(thread, section);
      })
      .catch(showError);
  });
  box.appendChild(submitBtn);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function showEditCommentModal(comment, thread) {
  const overlay = el('div', {className: 'modal-overlay', id: 'thread-edit-container'});
  const box = el('div', {className: 'modal-box'});

  const header = el('div', {className: 'modal-header'});
  header.appendChild(el('h3', {}, 'Edit Comment'));
  const closeBtn = el('button', {className: 'modal-close', textContent: '✕'});
  closeBtn.addEventListener('click', () => overlay.remove());
  header.appendChild(closeBtn);
  box.appendChild(header);

  const textarea = el('textarea', {id: 'thread-edit-text', textContent: comment.content});
  box.appendChild(textarea);

  const submitBtn = el('button', {
    id: 'thread-edit-submit',
    className: 'btn-primary modal-submit',
    textContent: 'Save',
  });
  submitBtn.addEventListener('click', () => {
    const content = textarea.value.trim();
    if (!content) { showError('Comment cannot be empty.'); return; }
    apiCall('comment', 'PUT', {id: comment.id, content})
      .then(() => {
        overlay.remove();
        const section = document.getElementById('comment-list-container');
        if (section) loadComments(thread, section);
      })
      .catch(showError);
  });
  box.appendChild(submitBtn);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// ─── PROFILE ───────────────────────────────────────────────────────────────────
function showProfile(userId, pushHistory) {
  if (pushHistory !== false) {
    history.pushState(null, '', parseInt(userId) === parseInt(state.userId) ? '/#profile' : '/#profile=' + userId);
  }

  const contentArea = document.getElementById('main-content-area');
  if (!contentArea) {
    loadDashboard();
    sleep(400).then(() => showProfile(userId));
    return;
  }
  while (contentArea.firstChild) contentArea.removeChild(contentArea.firstChild);

  const spinnerWrapper = el('div', {className: 'spinner-wrapper'});
  spinnerWrapper.appendChild(el('div', {className: 'spinner'}));
  contentArea.appendChild(spinnerWrapper);

  apiCall('user?userId=' + userId, 'GET')
    .then(user => {
      while (contentArea.firstChild) contentArea.removeChild(contentArea.firstChild);
      renderProfile(contentArea, user, userId);
    })
    .catch(showError);
}

function renderProfile(container, user, userId) {
  const isSelf = parseInt(userId) === parseInt(state.userId);
  const isAdmin = state.currentUser && state.currentUser.admin;

  const wrapper = el('div', {className: 'profile-container'});

  const profileHeader = el('div', {className: 'profile-header'});
  const avatarImg = el('img', {
    className: 'profile-avatar',
    src: user.image || generateAvatar(user.name),
    alt: user.name,
  });
  profileHeader.appendChild(avatarImg);

  const info = el('div', {className: 'profile-info'});
  info.appendChild(el('h2', {}, user.name));
  info.appendChild(el('p', {}, user.email));
  if (user.admin) info.appendChild(el('span', {className: 'private-badge', textContent: 'admin'}));
  profileHeader.appendChild(info);
  wrapper.appendChild(profileHeader);

  if (isSelf) {
    const editSection = el('div', {className: 'profile-edit-section'});
    editSection.appendChild(el('h3', {className: 'profile-section-heading'}, 'Edit Profile'));

    const nameGroup = el('div', {className: 'form-group'});
    nameGroup.appendChild(el('label', {textContent: 'Name'}));
    const nameInput = el('input', {type: 'text', value: user.name});
    nameGroup.appendChild(nameInput);
    editSection.appendChild(nameGroup);

    const emailGroup = el('div', {className: 'form-group'});
    emailGroup.appendChild(el('label', {textContent: 'Email'}));
    const emailInput = el('input', {type: 'text', value: user.email});
    emailGroup.appendChild(emailInput);
    editSection.appendChild(emailGroup);

    const passGroup = el('div', {className: 'form-group'});
    passGroup.appendChild(el('label', {textContent: 'New Password (leave blank to keep)'}));
    const passInput = el('input', {type: 'password', placeholder: '••••••••'});
    passGroup.appendChild(passInput);
    editSection.appendChild(passGroup);

    const imgGroup = el('div', {className: 'form-group'});
    imgGroup.appendChild(el('label', {textContent: 'Profile Image'}));
    const imgInput = el('input', {type: 'file', accept: 'image/*', className: 'file-input'});
    imgGroup.appendChild(imgInput);
    editSection.appendChild(imgGroup);

    const saveBtn = el('button', {className: 'btn-primary', textContent: 'Save Changes'});
    saveBtn.addEventListener('click', () => {
      const updates = {};
      if (nameInput.value.trim()) updates.name = nameInput.value.trim();
      if (emailInput.value.trim()) updates.email = emailInput.value.trim();
      if (passInput.value) updates.password = passInput.value;
      const file = imgInput.files[0];
      const doUpdate = imageData => {
        if (imageData) updates.image = imageData;
        apiCall('user', 'PUT', updates)
          .then(() => {
            state.currentUser = Object.assign({}, state.currentUser, updates);
            updateHeader(true);
            showProfile(userId);
          })
          .catch(showError);
      };
      if (file) {
        fileToDataUrl(file).then(doUpdate).catch(showError);
      } else {
        doUpdate(null);
      }
    });
    editSection.appendChild(saveBtn);
    wrapper.appendChild(editSection);
  }

  if (isAdmin && !isSelf) {
    const adminSection = el('div', {className: 'profile-admin-section'});
    adminSection.appendChild(el('h3', {className: 'profile-admin-heading'}, 'Permissions'));

    const select = el('select', {id: 'user-permission'});
    const optUser = el('option', {value: 'false', textContent: 'User'});
    const optAdmin = el('option', {value: 'true', textContent: 'Admin'});
    if (user.admin) optAdmin.selected = true;
    else optUser.selected = true;
    select.appendChild(optUser);
    select.appendChild(optAdmin);
    adminSection.appendChild(select);
    adminSection.appendChild(document.createTextNode(' '));

    const permBtn = el('button', {id: 'user-permission-submit', className: 'btn-primary', textContent: 'Update'});
    permBtn.addEventListener('click', () => {
      const turnon = select.value === 'true';
      apiCall('user/admin', 'PUT', {userId: userId, turnon})
        .then(() => showProfile(userId))
        .catch(showError);
    });
    adminSection.appendChild(permBtn);
    wrapper.appendChild(adminSection);
  }

  wrapper.appendChild(el('h3', {className: 'profile-threads-heading'}, 'Threads by ' + user.name));

  const threadList = el('div', {id: 'profile-thread-list'});
  wrapper.appendChild(threadList);
  container.appendChild(wrapper);

  const fetchAllUserThreads = (start, accumulated) => {
    return apiCall('threads?start=' + start, 'GET')
      .then(data => {
        let threadIds = [];
        if (Array.isArray(data)) threadIds = data;
        else if (data && Array.isArray(data.threads)) threadIds = data.threads;
        threadIds = threadIds.filter(id => typeof id === 'number' || (typeof id === 'string' && !isNaN(id)));

        const allIds = accumulated.concat(threadIds);
        if (threadIds.length === 5) {
          return fetchAllUserThreads(start + 5, allIds);
        }
        return allIds;
      })
      .catch(() => accumulated);
  };

  fetchAllUserThreads(0, [])
    .then(allThreadIds => {
      if (allThreadIds.length === 0) {
        threadList.appendChild(el('p', {}, 'No threads yet.'));
        return;
      }
      const targetUserId = parseInt(userId);
      allThreadIds.forEach(threadId => {
        apiCall('thread?id=' + threadId, 'GET')
          .then(t => {
            if (parseInt(t.creatorId) !== targetUserId) return;
            const item = el('div', {className: 'profile-thread-container'});
            item.appendChild(el('div', {className: 'profile-thread-title', textContent: t.title}));
            item.appendChild(el('div', {className: 'profile-thread-content', textContent: t.content}));
            const metaRow = el('div', {className: 'profile-thread-meta'});
            metaRow.appendChild(el('span', {className: 'profile-thread-likes', textContent: '♥ ' + likesCount(t.likes) + ' likes'}));
            const commentsSpan = el('span', {className: 'profile-thread-comments', textContent: '💬 — comments'});
            apiCall('comments?threadId=' + t.id, 'GET')
              .then(d => {
                const c = Array.isArray(d) ? d : (d.comments || []);
                commentsSpan.textContent = '💬 ' + c.length + ' comments';
              })
              .catch(() => {});
            metaRow.appendChild(commentsSpan);
            item.appendChild(metaRow);
            item.addEventListener('click', () => showThread(t.id));
            threadList.appendChild(item);
          })
          .catch(() => {});
      });
    })
    .catch(() => {});
}

// ─── POLLING ──────────────────────────────────────────────────────────────────
function startPolling(threadId) {
  stopPolling();
  let lastCommentCount = -1;
  let lastLikeCount = -1;

  state.pollInterval = setInterval(() => {
    apiCall('thread?id=' + threadId, 'GET', null, null, true)
      .then(thread => {
        const likeCount = likesCount(thread.likes);
        const likesEl = document.getElementById('thread-likes');
        if (likesEl && likeCount !== lastLikeCount) {
          likesEl.textContent = '♥ ' + likeCount + ' likes';
          lastLikeCount = likeCount;
        }
      })
      .catch(() => {});

    apiCall('comments?threadId=' + threadId, 'GET', null, null, true)
      .then(data => {
        const comments = Array.isArray(data) ? data : (data.comments || []);
        if (lastCommentCount !== -1 && comments.length > lastCommentCount) {
          const section = document.getElementById('comment-list-container');
          if (section) {
            apiCall('thread?id=' + threadId, 'GET')
              .then(thread => loadComments(thread, section))
              .catch(() => {});
          }
          if (state.currentUser && isWatchingThread(state.currentUser, threadId)) {
            showNotification('New comment on thread you\'re watching!');
          }
        }
        lastCommentCount = comments.length;
      })
      .catch(() => {});
  }, 3000);
}

function stopPolling() {
  if (state.pollInterval) {
    clearInterval(state.pollInterval);
    state.pollInterval = null;
  }
}

function showNotification(msg) {
  const notif = el('div', {className: 'toast-notification'}, msg);
  document.body.appendChild(notif);
  setTimeout(() => { if (notif.parentNode) notif.remove(); }, 4000);
}

// ─── URL / HASH ROUTING ───────────────────────────────────────────────────────
function handleHashRouting() {
  const hash = window.location.hash;
  if (!hash || hash === '#' || hash === '#dashboard') return;
  if (hash.startsWith('#thread=')) {
    const threadId = parseInt(hash.replace('#thread=', ''));
    if (threadId) {
      state.currentThreadId = threadId;
      showThread(threadId, true, false);
    }
  } else if (hash === '#profile') {
    state.currentThreadId = -1;
    showProfile(state.userId, false);
  } else if (hash.startsWith('#profile=')) {
    const userId = parseInt(hash.replace('#profile=', ''));
    if (userId) {
      state.currentThreadId = -1;
      showProfile(userId, false);
    }
  }
}

window.addEventListener('popstate', () => {
  if (!state.token) return;
  const hash = window.location.hash;
  if (!hash || hash === '#' || hash === '#dashboard') {
    const contentArea = document.getElementById('main-content-area');
    if (contentArea) {
      state.currentThreadId = null;
      while (contentArea.firstChild) contentArea.removeChild(contentArea.firstChild);
      contentArea.appendChild(el('div', {className: 'empty-state'}, 'Select a thread to start reading'));
    }
  } else {
    handleHashRouting();
  }
});

// ─── INIT ─────────────────────────────────────────────────────────────────────
function init() {
  if (localStorage.getItem('qanda_theme') === 'light') {
    document.body.classList.add('light');
  }

  const existingHeader = document.querySelector('header');
  if (existingHeader) {
    existingHeader.id = 'app-header';
    while (existingHeader.firstChild) existingHeader.removeChild(existingHeader.firstChild);
  }

  if (state.token) {
    loadDashboard();
  } else {
    showAuthPage(false);
  }
}

init();