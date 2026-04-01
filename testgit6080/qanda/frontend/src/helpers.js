/**
 * Given a js file object representing a jpg or png image, such as one taken
 * from a html file input element, return a promise which resolves to the file
 * data as a data url.
 * More info:
 *   https://developer.mozilla.org/en-US/docs/Web/API/File
 *   https://developer.mozilla.org/en-US/docs/Web/API/FileReader
 *   https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
 * 
 * Example Usage:
 *   const file = document.querySelector('input[type="file"]').files[0];
 *   console.log(fileToDataUrl(file));
 * @param {File} file The file to be read.
 * @return {Promise<string>} Promise which resolves to the file as a data url.
 */
export function fileToDataUrl(file) {
    const validFileTypes = [ 'image/jpeg', 'image/png', 'image/jpg' ]
    const valid = validFileTypes.find(type => type === file.type);
    // Bad data, let's walk away.
    if (!valid) {
        throw Error('provided file is not a png, jpg or jpeg image.');
    }
    
    const reader = new FileReader();
    const dataUrlPromise = new Promise((resolve,reject) => {
        reader.onerror = reject;
        reader.onload = () => resolve(reader.result);
    });
    reader.readAsDataURL(file);
    return dataUrlPromise;
}

export function formatRelativeTime(dateStr) {
  const now = new Date();
  const posted = new Date(dateStr);
  const diffMs = now - posted;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return diffMins + ' minute(s) ago';
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return diffHours + ' hour(s) ago';
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return diffDays + ' day(s) ago';
  const diffWeeks = Math.floor(diffDays / 7);
  return diffWeeks + ' week(s) ago';
}

/**
 * Format a date to a short readable string.
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Create a DOM element with optional properties.
 * @param {string} tag
 * @param {object} props
 * @param  {...Node|string} children
 * @returns {HTMLElement}
 */
export function el(tag, props = {}, ...children) {
  const element = document.createElement(tag);
  for (const [key, val] of Object.entries(props)) {
    if (key === 'className') element.className = val;
    else if (key === 'style' && typeof val === 'object') Object.assign(element.style, val);
    else if (key.startsWith('on') && typeof val === 'function') {
      element.addEventListener(key.slice(2).toLowerCase(), val);
    } else {
      element[key] = val;
    }
  }
  for (const child of children) {
    if (child == null) continue;
    if (typeof child === 'string') element.appendChild(document.createTextNode(child));
    else element.appendChild(child);
  }
  return element;
}

/**
 * Generate a default avatar SVG data URL from initials.
 * @param {string} name
 * @returns {string}
 */
export function generateAvatar(name) {
  const initials = (name || '?').substring(0, 2).toUpperCase();
  const colors = ['#7c6af7','#c084fc','#34d399','#fbbf24','#f87171','#60a5fa'];
  const color = colors[name ? name.charCodeAt(0) % colors.length : 0];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
    <rect width="40" height="40" fill="${color}" rx="20"/>
    <text x="20" y="26" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="700" fill="white">${initials}</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(svg);
}