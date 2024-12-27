const getUserIdFromPage = () => {
  try {
    return JSON.parse(document.getElementById('page-info')?.dataset.session).user.id
  } catch {}
}

/**
 * Converts a timestamp into a human-readable relative date
 * @param {number} previous The timestamp of the date to get the time difference from
 * @returns A human-readable relative time
 */
function timeDifference (previous) {
  const msPerMinute = 60 * 1000
  const msPerHour = msPerMinute * 60
  const msPerDay = msPerHour * 24
  const msPerWeek = msPerDay * 7

  const elapsed = Date.now() - new Date(previous).getTime()

  if (elapsed < msPerMinute) return Math.floor(elapsed / 1000) + 's'
  if (elapsed < msPerHour) return Math.floor(elapsed / msPerMinute) + 'm'
  if (elapsed < msPerDay) return Math.floor(elapsed / msPerHour) + 'h'
  if (elapsed < msPerWeek) return Math.floor(elapsed / msPerDay) + 'd'
  return Math.floor(elapsed / msPerWeek) + 'w'
}

/**
 * Loads a single page of user notifications
 * @param {number} page The 1-indexed page number
 */
async function loadNotificationsData (page) {
  const userId = getUserIdFromPage()
  const apiToken = '4f7769439adf7ef8e482d2daef77375cd6d0158b65fcdca543b74b5c0c92'
  return await fetch(`https://c.gethopscotch.com/api/v2/users/${userId}/activity_stream?api_token=${apiToken}&page=${page}`, {
    credentials: 'include'
  }).then(x => x.json()).catch(() => {})
}

function normalizeSystemNotification (data) {
  if (data.type === 'project') data.user.nickname = ''
  if (data.user?.id === 665372 && data.user?.avatar_type === 3) data.user.avatar_type = 16
  data.user ??= { id: '665372', avatar_type: 16 }
}

function getAvatarImage (data) {
  return /^https:\/\/hopscotch-images.s3.amazonaws.com\//.test(data.user?.remote_avatar_url)
    ? data.user.remote_avatar_url
    : `/images/webavatars/${data.user?.avatar_type || 0}.png`
}

function addClickableThumbnail (container, notification) {
  const thumbnailLink = container.appendChild(document.createElement('a'))
  thumbnailLink.classList.add('notification-thumbnail')
  thumbnailLink.href = '/p/' + notification.project.uuid
  thumbnailLink.title = notification.project.title

  const metadataStr = JSON.stringify({ ...notification.project, user: notification.user })
  thumbnailLink.setAttribute('onclick', `event.preventDefault() || EmbeddedPlayer.show('${notification.project.uuid}', ${metadataStr}, false)`)

  const thumbnail = thumbnailLink.appendChild(document.createElement('img'))
  thumbnail.classList.add('notification-thumbnail')
  thumbnail.addEventListener('error', () => { thumbnail.src = '/images/missing_thumbnail.webp' }, { once: true })
  thumbnail.src = notification.project.screenshot_url
}

function renderNotification (popup, notification) {
  const container = popup.appendChild(document.createElement('div'))
  container.classList.add('notification')

  normalizeSystemNotification(notification)

  const avatarContainer = container.appendChild(document.createElement('a'))
  avatarContainer.href = '/u/' + notification.user.id
  const avatar = avatarContainer.appendChild(document.createElement('img'))
  avatar.src = getAvatarImage(notification)
  const span = container.appendChild(document.createElement('span'))

  if (notification.user?.nickname) {
    const link = span.appendChild(document.createElement('a'))
    link.href = avatarContainer.href
    link.innerText = notification.user?.nickname
    span.innerHTML += ' '
  }

  // eslint-disable-next-line eqeqeq
  const isHopbotLink = notification.project?.user_id == '7217738' && notification.type === 'project' && notification.project?.title
  if (isHopbotLink) notification.text = notification.project.title

  span.appendChild(document.createTextNode(notification.text + ' '))
  const timeSpan = span.appendChild(document.createElement('span'))
  timeSpan.classList.add('timestamp')
  timeSpan.innerText = timeDifference(notification.created_at)
  timeSpan.title = new Date(notification.created_at).toLocaleString()

  switch (notification.type) {
    case 'remix': avatarContainer.innerHTML += '<i class="hs-icon hs-remix"></i>'; break
    case 'like': avatarContainer.innerHTML += '<i class="hs-icon hs-heart-filled" style="color:red"></i>'; break
    case 'project': avatarContainer.innerHTML += '<i class="hs-icon hs-link"></i>'; break
    case 'plant': avatarContainer.innerHTML += '<img class="plant hs-icon" src="/images/profile-mushrooms.png">'; break
    default: break
  }

  if (notification.project && !isHopbotLink) {
    addClickableThumbnail(container, notification)
  }
}

async function showNotifs (popup) {
  const result = await loadNotificationsData(1)
  if (!result) popup.innerText = 'Could not load notifications'
  popup.innerHTML = ''
  result.activities.forEach(n => renderNotification(popup, n))

  let endOfResults = false; let busy = false; let page = 1
  // Request Next Page when scrolled to bottom
  popup.addEventListener('scroll', async function () {
    if (endOfResults) return
    const scrollPosition = popup.scrollTop
    const container = popup.getBoundingClientRect()
    if (scrollPosition + container.height < popup.scrollHeight - 40 || busy) return
    busy = true
    const result = await loadNotificationsData(++page).then(x => x?.activities)
    busy = false
    if (result?.length) return result.forEach(n => renderNotification(popup, n))
    endOfResults = true
  }, { passive: true })
}

function addNotificationsTab () {
  if (!getUserIdFromPage()) return

  document.body.classList.add('AENotifContainer')

  const notifButton = document.createElement('div')
  notifButton.classList.add('AENotifBtn')
  const icon = notifButton.appendChild(document.createElement('img'))
  icon.src = 'https://upload.wikimedia.org/wikipedia/commons/3/34/Font_Awesome_5_regular_bell.svg'
  icon.width = icon.height = 28
  document.body.appendChild(notifButton)

  notifButton.addEventListener('click', () => {
    document.body.classList.add('popup-open')
    const popup = document.createElement('div')
    popup.classList.add('profile-popup', 'AENotifPopup')
    document.body.appendChild(popup)
    const contentContainer = popup.appendChild(document.createElement('div'))
    contentContainer.style = 'overflow:auto; max-height:60vh; padding:4px 16px; overscroll-behavior: contain'
    contentContainer.innerHTML = '<p>Loading...</p>'
    showNotifs(contentContainer)
  })

  if (!document.body.classList.contains('profile')) return
  function closeProfilePopup (e) {
    const profilePopup = document.querySelector('.profile-popup')
    if (!profilePopup || e.target !== document.body) return
    e.preventDefault()
    profilePopup.remove()
    document.body.classList.remove('popup-open')
  }
  // Close when the user clicks outside of the popup
  document.body.addEventListener('click', closeProfilePopup)
}

addNotificationsTab()
