let player;
let currentTrack = 0;
let progressInterval;
let tracks = [];

// const SHEETDB_API_URL = 'https://sheetdb.io/api/v1/uvpm2f3oq7b9g';
const SHEETDB_API_URL = './assets/song-list/playlist.json';

function sheetdbToTracks(data) {
    return data.map(row => ({
        id: row.id,
        title: row.title,
        duration: null
    }));
}

let tracksLoaded = false;
let ytReady = false;

fetch(SHEETDB_API_URL)
    .then(res => res.json())
    .then(data => {
        tracks = sheetdbToTracks(data);
        tracksLoaded = true;
        renderPlaylist();
        tryInitPlayer();
    });

window.onYouTubeIframeAPIReady = function() {
    ytReady = true;
    tryInitPlayer();
};

function tryInitPlayer() {
    if (tracksLoaded && ytReady && tracks.length > 0 && !player) {
        player = new YT.Player('player', {
            height: '0',
            width: '0',
            videoId: tracks[currentTrack].id,
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
    }
}

function onPlayerReady(event) {
    event.target.playVideo();
    updateTrackUI(currentTrack);
    updateDurationsInPlaylist();
    startProgressUpdater();
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        startProgressUpdater();
    } else {
        stopProgressUpdater();
    }
    updatePlayPauseIcon();

    if (event.data === YT.PlayerState.ENDED) {
        nextTrack();
    }
}

function updatePlayPauseIcon() {
    const playBtn = document.querySelector('[data-play-btn]');
    if (player && typeof player.getPlayerState === 'function' && player.getPlayerState() === YT.PlayerState.PLAYING) {
        playBtn.classList.add('active');
    } else {
        playBtn.classList.remove('active');
    }
}

function togglePlay() {
    if (player && typeof player.getPlayerState === 'function') {
        const state = player.getPlayerState();
        if (state === YT.PlayerState.PLAYING) {
            player.pauseVideo();
        } else {
            player.playVideo();
        }
        setTimeout(updatePlayPauseIcon, 100);
    }
}

function nextTrack() {
    currentTrack = (currentTrack + 1) % tracks.length;
    loadTrack(currentTrack);
}

function prevTrack() {
    currentTrack = (currentTrack - 1 + tracks.length) % tracks.length;
    loadTrack(currentTrack);
}

function loadTrack(index) {
    currentTrack = index;
    if (player && typeof player.loadVideoById === 'function') {
        player.loadVideoById(tracks[currentTrack].id);
        updateTrackUI(currentTrack);
    }
}

function updateTrackUI(index) {
    const videoId = tracks[index].id;
    fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
        .then(res => res.json())
        .then(data => {
            document.querySelector('[data-player-banner]').src = data.thumbnail_url;
            document.querySelector('[data-title]').textContent = data.title;
            document.querySelector('[data-artist]').textContent = "YouTube Music";
        });

    updateTrackHighlight(index);
}

function updateTrackHighlight(index) {
    document.querySelectorAll(".music-item").forEach((el, i) => {
        el.classList.toggle("playing", i === index);
    });
}

function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ":" + (secs < 10 ? "0" : "") + secs;
}

const trackListEl = document.querySelector('[data-music-list]');
function renderPlaylist() {
    trackListEl.innerHTML = '';
    tracks.forEach((track, i) => {
        const li = document.createElement('li');
        li.innerHTML = `
  <button class="music-item ${i === 0 ? "playing" : ""}" data-playlist-toggler data-playlist-item="${i}">
    <img src="./assets/posters/default-poster.jpg" width="800" height="800" alt="${track.title} Album Poster"
      class="img-cover">

    <div class="item-icon">
      <span class="material-symbols-rounded">equalizer</span>
    </div>
    
    <span class="music-title">${track.title}</span>
  </button>
  `;
        li.querySelector('button').addEventListener('click', () => loadTrack(i));
        trackListEl.appendChild(li);
    });
    updateTrackHighlight(currentTrack);
}

function updateDurationsInPlaylist() {
    const currentIndex = currentTrack;
    const currentTime = player ? player.getCurrentTime() : 0;
    const playerState = player ? player.getPlayerState() : -1;

    if (tracks.every(t => t.duration !== null)) {
        renderPlaylist();
        return;
    }

    let i = 0;

    function loadNextDuration() {
        if (i >= tracks.length) {
            player.loadVideoById(tracks[currentIndex].id);
            updateTrackUI(currentIndex);
            if (player && player.seekTo) {
                player.seekTo(currentTime, true);
                if (playerState === YT.PlayerState.PLAYING) {
                    player.playVideo();
                } else {
                    player.pauseVideo();
                }
            }
            renderPlaylist();
            return;
        }
        if (tracks[i].duration !== null) {
            i++;
            loadNextDuration();
            return;
        }
        player.loadVideoById(tracks[i].id);
        let tries = 0;
        const interval = setInterval(() => {
            let dur = player.getDuration();
            if (dur && dur > 0) {
                tracks[i].duration = dur;
                clearInterval(interval);
                i++;
                loadNextDuration();
            }
            tries++;
            if (tries > 50) {
                clearInterval(interval);
                i++;
                loadNextDuration();
            }
        }, 100);
    }

    loadNextDuration();
}

function updateProgress() {
    const duration = player.getDuration();
    const currentTime = player.getCurrentTime();

    if (!duration || duration === 0) return;

    const seekRange = document.querySelector('[data-seek]');
    seekRange.value = currentTime;
    seekRange.max = duration;

    const runningTime = document.querySelector('[data-running-time]');
    const totalTime = document.querySelector('[data-duration]');
    runningTime.textContent = formatDuration(currentTime);
    totalTime.textContent = formatDuration(duration);

    // Update range fill
    const rangeFill = seekRange.nextElementSibling;
    const rangeValue = (seekRange.value / seekRange.max) * 100;
    rangeFill.style.width = `${rangeValue}%`;
}

function startProgressUpdater() {
    stopProgressUpdater();
    updateProgress();
    progressInterval = setInterval(() => {
        if (player.getPlayerState() !== YT.PlayerState.PLAYING) {
            stopProgressUpdater();
            return;
        }
        updateProgress();
    }, 1000);
}

function stopProgressUpdater() {
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
}

renderPlaylist();
document.addEventListener('DOMContentLoaded', updatePlayPauseIcon);

// Add event listeners for controls
document.querySelector('[data-play-btn]').addEventListener('click', togglePlay);
document.querySelector('[data-skip-next]').addEventListener('click', nextTrack);
document.querySelector('[data-skip-prev]').addEventListener('click', prevTrack);
document.querySelector('[data-seek]').addEventListener('input', () => {
    const seekRange = document.querySelector('[data-seek]');
    if (player && player.seekTo) {
        player.seekTo(seekRange.value);
    }
});
