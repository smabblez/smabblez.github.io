document.documentElement.classList.add('js');

const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('.menu-toggle');
const menuLabel = document.querySelector('[data-menu-label]');
const menuCurrent = document.querySelector('[data-menu-current]');
const nav = document.querySelector('.site-nav');
const navLinks = [...document.querySelectorAll('.site-nav a')];
const sections = [...document.querySelectorAll('main section[id]')];
const siteConfig = window.SMABBLEZ_SITE || {};
const root = document.documentElement;
const body = document.body;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let currentSectionName = 'Home';

Object.entries(siteConfig.socials || {}).forEach(([name, url]) => {
  if (!url) return;
  document.querySelectorAll(`[data-social="${name}"]`).forEach((link) => { link.href = url; });
});

Object.entries(siteConfig.content || {}).forEach(([name, url]) => {
  if (!url) return;
  document.querySelectorAll(`[data-content="${name}"]`).forEach((link) => { link.href = url; });
});

const twitchFrame = document.querySelector('[data-twitch-frame]');
const twitchPlayerHost = document.querySelector('[data-twitch-player]');
const twitchOffline = document.querySelector('[data-twitch-offline]');
const twitchPlayerLabel = document.querySelector('[data-twitch-player-label]');
const twitchPlayerSignal = document.querySelector('[data-twitch-player-signal]');
const twitchPlayerStatus = document.querySelector('[data-twitch-player-status]');
const twitchStateKicker = document.querySelector('[data-twitch-state-kicker]');
const twitchStateTitle = document.querySelector('[data-twitch-state-title]');
const twitchStateCopy = document.querySelector('[data-twitch-state-copy]');

if (twitchFrame && twitchPlayerHost) {
  const twitchChannel = siteConfig.brand?.twitchChannel || 'smabblez';
  const twitchParent = window.location.hostname || 'localhost';
  let twitchPlayerStarted = false;
  let twitchPlayerState = 'loading';
  let twitchStateTimer = 0;

  const twitchStateContent = {
    loading: {
      label: 'MY TWITCH // CHECKING THE TENT',
      kicker: 'Checking live status',
      title: 'CHECKING THE TENT.<br><em>THE SHOW IS ONE CLICK AWAY.</em>',
      copy: 'Checking Twitch now. While we do, follow the channel or catch the latest broadcast.',
      status: 'Checking whether the show is live…'
    },
    ready: {
      label: 'MY TWITCH // CHECKING THE TENT',
      kicker: 'Player ready',
      title: 'CHECKING THE TENT.<br><em>THE SHOW IS ONE CLICK AWAY.</em>',
      copy: 'The player is ready and Twitch is reporting the channel status now.',
      status: 'Checking whether the show is live…'
    },
    online: {
      label: 'MY TWITCH // LIVE NOW',
      kicker: 'Live now',
      title: 'THE TENT IS OPEN.<br><em>JOIN THE CHAOS.</em>',
      copy: 'Smabblez is live now.',
      status: 'Smabblez is live now.'
    },
    offline: {
      label: 'MY TWITCH // BETWEEN SHOWS',
      kicker: 'Between shows',
      title: 'MISSED THE LIVE CHAOS?<br><em>WATCH THE LATEST SHOW.</em>',
      copy: 'Catch the newest broadcast, then follow on Twitch so you know when chat gets control again.',
      status: 'Smabblez is offline right now. The latest broadcast and clips are ready above.'
    },
    fallback: {
      label: 'MY TWITCH // PLAYER UNAVAILABLE',
      kicker: 'Player unavailable',
      title: 'THE PLAYER MISSED ITS CUE.<br><em>TWITCH IS ONE CLICK AWAY.</em>',
      copy: 'Open Twitch directly for the live show, the latest broadcast, and the best clips.',
      status: 'The embedded player could not load.'
    }
  };

  const setTwitchPlayerState = (state) => {
    twitchPlayerState = state;
    if (state === 'online' || state === 'offline' || state === 'fallback') {
      window.clearTimeout(twitchStateTimer);
    }
    twitchFrame.dataset.playerState = state;
    const content = twitchStateContent[state] || twitchStateContent.loading;
    twitchOffline?.setAttribute('aria-hidden', String(state === 'online'));
    if (twitchPlayerLabel) twitchPlayerLabel.textContent = content.label;
    if (twitchPlayerSignal) twitchPlayerSignal.dataset.signal = state;
    if (twitchStateKicker) twitchStateKicker.innerHTML = `<span>///</span> ${content.kicker}`;
    if (twitchStateTitle) twitchStateTitle.innerHTML = content.title;
    if (twitchStateCopy) twitchStateCopy.textContent = content.copy;
    if (twitchPlayerStatus) twitchPlayerStatus.firstChild.textContent = `${content.status} `;
  };

  const loadTwitchPlayer = async () => {
    if (twitchPlayerStarted) return;
    twitchPlayerStarted = true;
    try {
      if (!window.Twitch?.Player) {
        await new Promise((resolve, reject) => {
          const sdk = document.createElement('script');
          const timeout = window.setTimeout(() => {
            sdk.remove();
            reject(new Error('Twitch player timed out'));
          }, 8000);
          sdk.src = 'https://player.twitch.tv/js/embed/v1.js';
          sdk.async = true;
          sdk.onload = () => { window.clearTimeout(timeout); resolve(); };
          sdk.onerror = () => { window.clearTimeout(timeout); sdk.remove(); reject(new Error('Twitch player unavailable')); };
          document.head.append(sdk);
        });
      }
      if (!window.Twitch?.Player) throw new Error('Twitch player unavailable');
      twitchStateTimer = window.setTimeout(() => {
        if (twitchPlayerState === 'loading' || twitchPlayerState === 'ready') {
          setTwitchPlayerState('fallback');
        }
      }, 8000);
      const player = new window.Twitch.Player(twitchPlayerHost.id, {
        width: '100%',
        height: '100%',
        channel: twitchChannel,
        parent: [twitchParent],
        autoplay: false,
        muted: true
      });
      player.addEventListener(window.Twitch.Player.READY, () => {
        if (twitchPlayerState === 'loading') setTwitchPlayerState('ready');
      });
      player.addEventListener(window.Twitch.Player.ONLINE, () => setTwitchPlayerState('online'));
      player.addEventListener(window.Twitch.Player.PLAY, () => setTwitchPlayerState('online'));
      player.addEventListener(window.Twitch.Player.OFFLINE, () => setTwitchPlayerState('offline'));
    } catch {
      setTwitchPlayerState('fallback');
    }
  };
  setTwitchPlayerState('loading');
  if ('IntersectionObserver' in window) {
    const twitchObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      loadTwitchPlayer();
      twitchObserver.disconnect();
    }, { rootMargin: '80px 0px' });
    twitchObserver.observe(twitchFrame);
  } else {
    loadTwitchPlayer();
  }
}

const scheduleRoot = document.querySelector('[data-twitch-schedule]');
const scheduleList = document.querySelector('[data-schedule-list]');
const scheduleStatus = document.querySelector('[data-schedule-status]');
const scheduleDayOrder = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const scheduleDayLabels = { SU: 'SUN', MO: 'MON', TU: 'TUE', WE: 'WED', TH: 'THU', FR: 'FRI', SA: 'SAT' };

const scheduleClock = (value) => {
  const [hours = 0, minutes = 0] = String(value || '').split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour = hours % 12 || 12;
  return `${hour}${minutes ? `:${String(minutes).padStart(2, '0')}` : ''} ${suffix}`;
};

const timeZoneParts = (date, timeZone) => Object.fromEntries(
  new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value])
);

const scheduleDayCode = (shortDay) => Object.entries(scheduleDayLabels)
  .find(([, label]) => label.startsWith(String(shortDay || '').toUpperCase().slice(0, 2)))?.[0];

const renderSchedule = (payload) => {
  // Deploy refreshes can fail. Never turn an old weekly snapshot into new promises.
  const fetchedAt = Date.parse(payload?.fetchedAt);
  const age = Date.now() - fetchedAt;
  if (!Number.isFinite(age) || age < -300000 || age > 86400000) {
    throw new Error('The schedule snapshot is no longer current.');
  }
  const events = Array.isArray(payload?.events) ? payload.events : [];
  if (!scheduleList || !events.length) throw new Error('No scheduled streams are available.');
  const timeZone = payload.timezone || siteConfig.schedule?.timezone || 'America/Chicago';
  const now = new Date();
  const nowParts = timeZoneParts(now, timeZone);
  const todayCode = scheduleDayCode(nowParts.weekday);
  const todayIndex = scheduleDayOrder.indexOf(todayCode);
  const nowMinutes = Number(nowParts.hour) * 60 + Number(nowParts.minute);
  const upcoming = events.map((event) => {
    const eventIndex = scheduleDayOrder.indexOf(event.day);
    const [endHour = 0, endMinute = 0] = String(event.end || '').split(':').map(Number);
    let daysAway = (eventIndex - todayIndex + 7) % 7;
    if (daysAway === 0 && endHour * 60 + endMinute <= nowMinutes) daysAway = 7;
    return { ...event, daysAway };
  }).sort((left, right) => left.daysAway - right.daysAway || left.start.localeCompare(right.start)).slice(0, 5);

  const fragment = document.createDocumentFragment();
  upcoming.forEach((event, index) => {
    const streamDate = new Date(now.getTime() + event.daysAway * 86400000);
    const dateLabel = new Intl.DateTimeFormat('en-US', {
      timeZone,
      month: 'short',
      day: 'numeric'
    }).format(streamDate).toUpperCase();
    const card = document.createElement('li');
    card.className = 'schedule-card';
    if (index === 0) card.setAttribute('aria-label', 'Next scheduled stream');

    const date = document.createElement('span');
    date.className = 'schedule-date';
    const day = document.createElement('strong');
    day.textContent = scheduleDayLabels[event.day] || event.day;
    const calendarDate = document.createElement('small');
    calendarDate.textContent = dateLabel;
    date.append(day, calendarDate);

    const show = document.createElement('span');
    show.className = 'schedule-show';
    const title = document.createElement('strong');
    title.textContent = event.title || event.category || 'Live on Twitch';
    const source = document.createElement('small');
    source.className = index === 0 ? 'schedule-next' : '';
    source.textContent = index === 0 ? 'Next show' : 'Twitch schedule';
    show.append(title, source);

    const time = document.createElement('span');
    time.className = 'schedule-time';
    time.textContent = `${scheduleClock(event.start)} – ${scheduleClock(event.end)}`;
    card.append(date, show, time);
    fragment.append(card);
  });
  scheduleList.replaceChildren(fragment);
  const checked = new Intl.DateTimeFormat('en-US', { timeZone, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(new Date(fetchedAt));
  scheduleStatus.textContent = `Last checked on Twitch: ${checked}. Check the official schedule for changes.`;
  scheduleRoot.dataset.scheduleState = 'ready';
};

const loadSchedule = async () => {
  if (!scheduleRoot || scheduleRoot.dataset.scheduleState === 'loading' || scheduleRoot.dataset.scheduleState === 'ready') return;
  scheduleRoot.dataset.scheduleState = 'loading';
  try {
    const response = await fetch(siteConfig.schedule?.feed || 'schedule.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Schedule request failed: ${response.status}`);
    renderSchedule(await response.json());
  } catch {
    scheduleRoot.dataset.scheduleState = 'fallback';
    const fallback = document.createElement('li');
    fallback.className = 'schedule-fallback';
    fallback.textContent = 'Current stream times are on Twitch. Check the official schedule before planning your next visit.';
    scheduleList.replaceChildren(fallback);
    scheduleStatus.textContent = 'I couldn’t confirm the latest times here. My official Twitch schedule is available below.';
  }
};

if (scheduleRoot) {
  if ('IntersectionObserver' in window) {
    const scheduleObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      loadSchedule();
      scheduleObserver.disconnect();
    }, { rootMargin: '240px 0px' });
    scheduleObserver.observe(scheduleRoot);
  } else {
    loadSchedule();
  }
}

const soundPrompt = document.querySelector('[data-sound-prompt]');
const soundToggle = document.querySelector('[data-sound-toggle]');
const soundSkip = document.querySelector('[data-sound-skip]');
const soundPrevious = document.querySelector('[data-sound-previous]');
const soundVolume = document.querySelector('[data-sound-volume]');
const soundDismiss = document.querySelector('[data-sound-dismiss]');
const soundRestore = document.querySelector('[data-sound-restore]');
const soundStatus = document.querySelector('[data-sound-status]');
const soundTrack = document.querySelector('[data-sound-track]');
const soundArt = document.querySelector('[data-sound-art]');
const soundProgress = document.querySelector('[data-sound-progress]');
const soundAudio = document.querySelector('[data-sound-audio]');
const soundVolumeIcon = document.querySelector('[data-sound-volume-icon]');
const soundVolumeValue = document.querySelector('[data-sound-volume-value]');
const spotifyTracks = (siteConfig.music?.spotifyTracks || []).filter((track) => track.preview);
let currentTrackIndex = 0;
let loadedTrackIndex = -1;

const setSoundState = (playing, message = playing ? 'Preview playing' : 'Preview ready') => {
  soundStatus.textContent = message;
  const action = playing ? 'Pause soundtrack' : 'Play soundtrack';
  soundToggle.textContent = playing ? '\u2161' : '\u25B6';
  soundToggle.setAttribute('aria-label', action);
  soundToggle.title = action;
  soundToggle.setAttribute('aria-pressed', String(playing));
};

const updateVolumeUI = () => {
  const percent = Math.round(soundAudio.volume * 100);
  soundAudio.dataset.volume = String(percent);
  soundVolume.value = String(percent);
  soundVolume.style.setProperty('--volume-level', `${percent}%`);
  soundVolumeValue.textContent = `${percent}%`;
  soundVolumeIcon.textContent = percent === 0 ? '\u{1F507}' : percent < 50 ? '\u{1F509}' : '\u{1F50A}';
};

const updateTrackInfo = () => {
  const track = spotifyTracks[currentTrackIndex];
  if (!track) return;
  soundTrack.textContent = track.title;
  soundArt.href = track.url || siteConfig.socials?.spotify || soundArt.href;
  if (track.art) {
    soundArt.style.backgroundImage = `url("${track.art}")`;
    soundArt.classList.add('has-cover');
  }
};

const loadCurrentTrack = (reset = true) => {
  const track = spotifyTracks[currentTrackIndex];
  if (!track) return false;
  updateTrackInfo();
  if (loadedTrackIndex !== currentTrackIndex) {
    soundAudio.src = track.preview;
    loadedTrackIndex = currentTrackIndex;
  } else if (reset) {
    soundAudio.currentTime = 0;
  }
  soundProgress.style.width = '0%';
  return true;
};

const playCurrentTrack = async () => {
  if (loadedTrackIndex !== currentTrackIndex && !loadCurrentTrack(false)) return;
  try {
    await soundAudio.play();
    delete soundAudio.dataset.playError;
  } catch (error) {
    soundAudio.dataset.playError = error?.name || 'PlaybackError';
    setSoundState(false, 'Tap play to listen');
  }
};

const changeTrack = (direction, keepPlaying = !soundAudio.paused) => {
  if (!spotifyTracks.length) return;
  currentTrackIndex = (currentTrackIndex + direction + spotifyTracks.length) % spotifyTracks.length;
  loadCurrentTrack();
  if (keepPlaying) playCurrentTrack();
  else setSoundState(false, direction > 0 ? 'Next preview ready' : 'Previous preview ready');
};

soundToggle.addEventListener('click', () => {
  if (!soundAudio.paused) soundAudio.pause();
  else playCurrentTrack();
});

soundSkip.addEventListener('click', () => changeTrack(1));
soundPrevious.addEventListener('click', () => {
  if (loadedTrackIndex === currentTrackIndex && soundAudio.currentTime > 3) {
    soundAudio.currentTime = 0;
    soundProgress.style.width = '0%';
    setSoundState(!soundAudio.paused, 'Preview restarted');
    return;
  }
  changeTrack(-1);
});
soundVolume.addEventListener('input', () => {
  soundAudio.volume = Math.min(1, Math.max(0, Number(soundVolume.value) / 100));
  updateVolumeUI();
  try { window.localStorage.setItem('smabblez-player-volume', soundVolume.value); } catch {}
});

soundAudio.addEventListener('play', () => setSoundState(true));
soundAudio.addEventListener('pause', () => {
  if (!soundAudio.ended) setSoundState(false, 'Paused');
});
soundAudio.addEventListener('timeupdate', () => {
  const progress = soundAudio.duration > 0 ? (soundAudio.currentTime / soundAudio.duration) * 100 : 0;
  soundProgress.style.width = `${Math.min(100, Math.max(0, progress))}%`;
});
soundAudio.addEventListener('ended', () => changeTrack(1, true));
soundAudio.addEventListener('error', () => {
  setSoundState(false, 'Preview unavailable — open Spotify');
});

const setSoundCollapsed = (collapsed) => {
  soundPrompt.classList.toggle('collapsed', collapsed);
  soundPrompt.setAttribute('aria-label', collapsed ? 'Smabblez soundtrack player, minimized' : 'Smabblez soundtrack preview controls');
  try { window.localStorage.setItem('smabblez-player-collapsed', String(collapsed)); } catch {}
};

soundDismiss.addEventListener('click', () => setSoundCollapsed(true));
soundRestore.addEventListener('click', () => {
  setSoundCollapsed(false);
  updateTrackInfo();
});

let playerStartsCollapsed = true;
try {
  const savedPlayerState = window.localStorage.getItem('smabblez-player-collapsed');
  playerStartsCollapsed = savedPlayerState !== 'false';
  setSoundCollapsed(playerStartsCollapsed);
} catch {
  setSoundCollapsed(true);
}

try {
  const savedVolume = window.localStorage.getItem('smabblez-player-volume');
  const savedVolumeNumber = Number(savedVolume);
  soundAudio.volume = savedVolume !== null && Number.isFinite(savedVolumeNumber)
    ? Math.min(1, Math.max(0, savedVolumeNumber / 100))
    : .72;
} catch {
  soundAudio.volume = .72;
}

updateVolumeUI();
if (!playerStartsCollapsed) updateTrackInfo();
const hasPlayableTracks = spotifyTracks.length > 0;
soundToggle.disabled = !hasPlayableTracks;
soundSkip.disabled = !hasPlayableTracks;
soundPrevious.disabled = !hasPlayableTracks;
soundVolume.disabled = !hasPlayableTracks;
setSoundState(false, hasPlayableTracks ? 'Press play for preview' : 'Previews unavailable');

const discordPreview = document.querySelector('[data-discord-preview]');
const discordOnline = document.querySelector('[data-discord-online]');
const discordMembers = document.querySelector('[data-discord-members]');
const discordInviteCode = siteConfig.community?.discordInviteCode;

const loadDiscordPreview = () => {
  if (!discordPreview || !discordInviteCode || discordPreview.dataset.loaded === 'true') return;
  discordPreview.dataset.loaded = 'true';
  fetch(`https://discord.com/api/v10/invites/${encodeURIComponent(discordInviteCode)}?with_counts=true`)
    .then((response) => {
      if (!response.ok) throw new Error('Discord preview unavailable');
      return response.json();
    })
    .then((invite) => {
      const online = Number(invite.approximate_presence_count ?? invite.profile?.online_count);
      const members = Number(invite.approximate_member_count ?? invite.profile?.member_count);
      if (Number.isFinite(online)) discordOnline.textContent = online.toLocaleString();
      if (Number.isFinite(members)) discordMembers.textContent = members.toLocaleString();
      discordPreview.title = `${invite.guild?.name || 'The Clown Tent'} community snapshot`;
    })
    .catch(() => {
      discordOnline.textContent = 'See who is';
      discordMembers.textContent = 'Meet the';
    });
};

if (discordPreview && discordInviteCode) {
  const followSection = document.querySelector('#follow');
  if ('IntersectionObserver' in window && followSection) {
    const discordObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      loadDiscordPreview();
      discordObserver.disconnect();
    }, { rootMargin: '220px 0px' });
    discordObserver.observe(followSection);
  } else {
    loadDiscordPreview();
  }
}

const analyticsEndpoint = siteConfig.analytics?.endpoint?.trim();
const getAttribution = () => {
  const params = new URLSearchParams(window.location.search);
  const utm = Object.fromEntries(['source', 'medium', 'campaign', 'content', 'term']
    .map((key) => [`utm_${key}`, params.get(`utm_${key}`)?.slice(0, 160) || ''])
    .filter(([, value]) => value));
  let referrerOrigin = '';
  try {
    referrerOrigin = document.referrer ? new URL(document.referrer).origin : '';
  } catch {
    referrerOrigin = '';
  }
  return {
    source: utm.utm_source ? 'utm' : (referrerOrigin ? 'referral' : 'direct'),
    ...utm,
    referrerOrigin
  };
};
const sendAnalyticsEvent = (body) => {
  if (!analyticsEndpoint) return;
  try {
    if (typeof navigator.sendBeacon === 'function' && navigator.sendBeacon(analyticsEndpoint, new Blob([body], { type: 'application/json' }))) return;
  } catch {}
  fetch(analyticsEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
};
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href]');
  if (!link) return;
  const label = link.dataset.track || link.dataset.social || link.dataset.content;
  if (!label) return;
  const destination = new URL(link.href, window.location.href);
  const detail = {
    event: 'outbound_click',
    label,
    destination: `${destination.origin}${destination.pathname}`,
    page: window.location.pathname,
    timestamp: new Date().toISOString(),
    attribution: getAttribution()
  };
  window.dispatchEvent(new CustomEvent('smabblez:conversion', { detail }));
  sendAnalyticsEvent(JSON.stringify(detail));
});

const syncScroll = () => {
  header.classList.toggle('scrolled', window.scrollY > 18);
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
  root.style.setProperty('--scroll-progress', progress.toFixed(4));
};

let scrollFrame = 0;
const requestScrollSync = () => {
  if (scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(() => {
    syncScroll();
    scrollFrame = 0;
  });
};
syncScroll();
window.addEventListener('scroll', requestScrollSync, { passive: true });
window.addEventListener('resize', requestScrollSync, { passive: true });

const setMenuOpen = (open, { returnFocus = false } = {}) => {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close sections menu' : 'Open sections menu');
  menuLabel.textContent = open ? 'Close sections menu' : 'Open sections menu';
  menuCurrent.textContent = open ? 'Close' : currentSectionName;
  nav.classList.toggle('open', open);
  if (returnFocus) menuButton.focus();
};

menuButton.addEventListener('click', () => setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true'));
navLinks.forEach((link) => link.addEventListener('click', () => setMenuOpen(false)));

document.addEventListener('pointerdown', (event) => {
  if (menuButton.getAttribute('aria-expanded') !== 'true') return;
  if (nav.contains(event.target) || menuButton.contains(event.target)) return;
  setMenuOpen(false);
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    setMenuOpen(false, { returnFocus: true });
  }
});

const chaosEffects = document.querySelector('.chaos-effects');
const modeStatus = document.querySelector('[data-mode-status]');
const chaosCharacter = document.querySelector('[data-chaos-character]');
const chaosSupportArt = [...document.querySelectorAll('[data-chaos-support]')];
const heroCharacter = document.querySelector('.hero-character');
const honkButton = document.querySelector('[data-honk]');
const chaosConsole = document.querySelector('[data-chaos-console]');
const chaosPlay = document.querySelector('[data-chaos-play]');
const chaosOff = document.querySelector('[data-chaos-off]');
const chaosReaction = document.querySelector('[data-chaos-reaction]');
const chaosCaption = document.querySelector('[data-chaos-caption]');
const chaosMeter = document.querySelector('[data-chaos-meter]');
const chaosCount = document.querySelector('[data-chaos-count]');
const chaosHint = document.querySelector('[data-chaos-hint]');
const chaosMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const sparkColors = ['#ff2638', '#ffd42f', '#f6f1e7'];
const chaosBits = [
  { word: 'HONK!', title: 'A very serious clown meeting.', caption: 'The agenda is honk. The minutes are also honk.', shape: 'ring' },
  { word: 'PLOT TWIST!', title: 'The getaway car is a unicycle.', caption: 'Good news: parking just got easier.', shape: 'confetti' },
  { word: 'CHAT DID IT', title: 'Chat has the wheel.', caption: 'I would buckle up. Twice, if possible.', shape: 'star' },
  { word: 'BIG ENTRANCE', title: 'You ordered a dramatic entrance.', caption: 'The door was open. We used the confetti cannon.', shape: 'confetti' },
  { word: 'BONK!', title: 'The plot has left the building.', caption: 'We gave it a tiny hat and wished it luck.', shape: 'star' }
];
let chaosClicks = 0;
let chaosRounds = 0;
let chaosDeck = [];
let lastChaosAt = -Infinity;
let honkTimer = 0;
const chaosCleanup = new Map();

const clearChaosEffects = () => {
  chaosCleanup.forEach((timer, element) => { window.clearTimeout(timer); element.remove(); });
  chaosCleanup.clear();
  window.clearTimeout(honkTimer);
  heroCharacter?.classList.remove('honked');
};

const addChaosEffect = (element) => {
  // Bound work even when visitors click quickly or background animations are paused.
  if (chaosCleanup.size >= 80) return;
  element.setAttribute('aria-hidden', 'true');
  const remove = () => {
    window.clearTimeout(chaosCleanup.get(element));
    chaosCleanup.delete(element);
    element.remove();
  };
  chaosEffects.appendChild(element);
  chaosCleanup.set(element, window.setTimeout(remove, 1800));
  element.addEventListener('animationend', remove, { once: true });
};

const makeSparks = (x, y, amount = 18, shape = 'confetti') => {
  if (chaosMotion.matches) return;
  for (let index = 0; index < amount; index += 1) {
    const spark = document.createElement('i');
    const angle = (Math.PI * 2 * index) / amount;
    const distance = 40 + Math.random() * 110;
    spark.className = `spark chaos-particle chaos-particle-${shape}`;
    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    spark.style.setProperty('--spark-x', `${Math.cos(angle) * distance}px`);
    spark.style.setProperty('--spark-y', `${Math.sin(angle) * distance}px`);
    spark.style.setProperty('--spark-color', sparkColors[index % sparkColors.length]);
    addChaosEffect(spark);
  }
};

const dropChaosSticker = (x, y, word) => {
  if (chaosMotion.matches) return;
  const sticker = document.createElement('span');
  sticker.className = 'chaos-sticker';
  sticker.textContent = word;
  const edge = Math.min(150, window.innerWidth / 2);
  sticker.style.left = `${Math.max(edge, Math.min(window.innerWidth - edge, x))}px`;
  sticker.style.top = `${Math.max(80, Math.min(window.innerHeight - 70, y))}px`;
  sticker.style.setProperty('--sticker-color', sparkColors[Math.floor(Math.random() * (sparkColors.length - 1))]);
  sticker.style.setProperty('--sticker-rotate', `${-14 + Math.random() * 28}deg`);
  addChaosEffect(sticker);
};

const shuffleChaos = () => {
  chaosDeck = [...chaosBits];
  for (let index = chaosDeck.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [chaosDeck[index], chaosDeck[swap]] = [chaosDeck[swap], chaosDeck[index]];
  }
};

const bounceClown = () => {
  if (chaosMotion.matches) return;
  window.clearTimeout(honkTimer);
  heroCharacter?.classList.remove('honked');
  void heroCharacter?.offsetWidth;
  heroCharacter?.classList.add('honked');
  honkTimer = window.setTimeout(() => heroCharacter?.classList.remove('honked'), 460);
};

const causeTrouble = (x, y, showSticker = true) => {
  if (!body.classList.contains('chaos-on')) return;
  const animateReaction = performance.now() - lastChaosAt >= 120;
  lastChaosAt = performance.now();
  if (chaosClicks === 6) {
    chaosClicks = 0;
    shuffleChaos();
  }
  chaosClicks += 1;
  const finale = chaosClicks === 6;
  const bit = finale ? {
    word: 'ENCORE!',
    title: chaosRounds % 2 ? 'The tent has achieved liftoff.' : 'You brought the whole tent down.',
    caption: 'Six excellent decisions. Absolutely no adult supervision.',
    shape: 'star'
  } : chaosDeck[chaosClicks - 1];
  if (finale) chaosRounds += 1;
  chaosReaction.textContent = bit.title;
  chaosCaption.textContent = bit.caption;
  chaosMeter.value = chaosClicks;
  chaosCount.textContent = `${chaosClicks} / 6`;
  chaosPlay.innerHTML = finale ? 'Go again <span aria-hidden="true">↻</span>' : 'Cause trouble <span aria-hidden="true">✳</span>';
  chaosHint.textContent = finale ? 'Encore? You know you want to.' : 'Or tap an empty spot.';
  chaosConsole.classList.toggle('is-finale', finale);
  modeStatus.textContent = `${bit.title} ${finale ? 'Finale! Go again for another round.' : `${chaosClicks} of 6 until the finale.`}`;
  if (finale) {
    clearChaosEffects();
    makeSparks(window.innerWidth * .18, window.innerHeight * .5, 18, 'confetti');
    makeSparks(window.innerWidth * .82, window.innerHeight * .5, 18, 'confetti');
  }
  if (animateReaction || finale) {
    makeSparks(x, y, finale ? 28 : 12, bit.shape);
    if (showSticker) dropChaosSticker(x, y - 40, bit.word);
    bounceClown();
  }
};

honkButton?.addEventListener('click', (event) => {
  event.stopPropagation();
  const active = !body.classList.contains('chaos-on');
  setChaos(active);
  if (active) {
    const rect = honkButton.getBoundingClientRect();
    makeSparks(rect.left + rect.width / 2, rect.top + rect.height / 2, 18, 'ring');
    dropChaosSticker(rect.left + rect.width / 2, rect.top, 'HONK!');
    bounceClown();
    chaosPlay.focus();
  }
});

const setChaos = (active) => {
  const returnFocus = !active && chaosConsole.contains(document.activeElement);
  clearChaosEffects();
  body.classList.toggle('chaos-on', active);
  honkButton?.setAttribute('aria-pressed', String(active));
  honkButton?.setAttribute('aria-label', active ? "Honk Smabblez's nose to turn off Chaos Mode" : "Honk Smabblez's nose to turn on Chaos Mode");
  modeStatus.textContent = active ? 'Chaos Mode enabled. Cause six bits of trouble for a finale. Use the Cause trouble button or click an empty spot. Escape ends chaos.' : 'Chaos Mode ended. The tent is back in order.';
  chaosCharacter.src = active ? chaosCharacter.dataset.chaosSrc : chaosCharacter.dataset.normalSrc;
  chaosSupportArt.forEach((image) => {
    image.src = active ? image.dataset.chaosSrc : image.dataset.normalSrc;
  });
  chaosClicks = 0;
  chaosRounds = 0;
  lastChaosAt = -Infinity;
  chaosConsole.hidden = !active;
  chaosConsole.classList.remove('is-finale');
  chaosReaction.textContent = 'The big red nose was a warning.';
  chaosCaption.textContent = 'Six bits of trouble. One big finale. Take your time.';
  chaosMeter.value = 0;
  chaosCount.textContent = '0 / 6';
  chaosPlay.innerHTML = 'Cause trouble <span aria-hidden="true">✳</span>';
  chaosHint.textContent = 'Or tap an empty spot.';
  if (active) shuffleChaos();
  if (returnFocus) honkButton.focus({ preventScroll: true });
};

chaosPlay?.addEventListener('click', () => {
  const rect = chaosPlay.getBoundingClientRect();
  // The card already carries the joke; keep word stickers off its reading area.
  causeTrouble(rect.left + rect.width / 2, rect.top, false);
});
chaosOff?.addEventListener('click', () => setChaos(false));
chaosMotion.addEventListener('change', clearChaosEffects);
document.addEventListener('visibilitychange', () => { if (document.hidden) clearChaosEffects(); });

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && body.classList.contains('chaos-on')) setChaos(false);
});

document.addEventListener('click', (event) => {
  if (!body.classList.contains('chaos-on') || event.defaultPrevented || event.target.closest('a,button,input,label,summary,select,textarea,audio,video,iframe,[role],[tabindex],[contenteditable]:not([contenteditable="false"])')) return;
  if (!window.getSelection()?.isCollapsed) return;
  causeTrouble(event.clientX, event.clientY);
});

if (!reduceMotion && window.matchMedia('(pointer:fine)').matches) {
  const cursorNose = document.querySelector('.cursor-nose');
  window.addEventListener('pointermove', (event) => {
    root.style.setProperty('--cursor-x', `${event.clientX}px`);
    root.style.setProperty('--cursor-y', `${event.clientY}px`);
    cursorNose.classList.add('visible');
  }, { passive: true });
  document.addEventListener('pointerover', (event) => {
    cursorNose.classList.toggle('hot', Boolean(event.target.closest('a,button,input,label')));
  }, { passive: true });
  document.addEventListener('pointerout', (event) => {
    if (!event.relatedTarget) cursorNose.classList.remove('visible');
    if (!event.relatedTarget?.closest?.('a,button,input,label')) cursorNose.classList.remove('hot');
  }, { passive: true });

  document.querySelectorAll('.social-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--glare-x', `${((event.clientX - rect.left) / rect.width) * 100}%`);
      card.style.setProperty('--glare-y', `${((event.clientY - rect.top) / rect.height) * 100}%`);
      card.style.setProperty('--glare-opacity', '.72');
    }, { passive: true });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--glare-opacity', '0');
    }, { passive: true });
  });
}

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px' });
  document.querySelectorAll('.reveal').forEach((item) => revealObserver.observe(item));

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        const matches = link.getAttribute('href') === `#${entry.target.id}`;
        link.classList.toggle('active', matches);
        if (matches) {
          link.setAttribute('aria-current', 'page');
          currentSectionName = link.dataset.sectionName || 'Sections';
          if (menuButton.getAttribute('aria-expanded') !== 'true') menuCurrent.textContent = currentSectionName;
        } else {
          link.removeAttribute('aria-current');
        }
      });
    });
  }, { rootMargin: '-35% 0px -55%', threshold: 0 });
  sections.forEach((section) => sectionObserver.observe(section));
} else {
  document.querySelectorAll('.reveal').forEach((item) => item.classList.add('in-view'));
}
