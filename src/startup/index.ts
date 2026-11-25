const overlay = document.getElementById('app-loading')
const message = document.getElementById('app-loading-message')
const retry = document.getElementById('app-loading-retry')
const timer = window.setTimeout(() => {
  if (message) message.textContent = '加载时间较长，请稍候或重新加载。'
  if (retry) retry.hidden = false
}, 15000)

retry?.addEventListener('click', () => window.location.reload())

export function isStarting() {
  return Boolean(overlay?.isConnected && !overlay.classList.contains('is-leaving'))
}

export function finishStartup() {
  window.clearTimeout(timer)
  if (!overlay || overlay.classList.contains('is-leaving')) return
  overlay.classList.add('is-leaving')
  overlay.setAttribute('aria-hidden', 'true')
  window.setTimeout(() => overlay.remove(), 180)
}
