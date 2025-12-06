// assets/js/splash.js
function closeSplash() {
    const splash = document.getElementById('splashScreen');
    const playerContainer = document.getElementById('playerContainer');

    splash.classList.add('hidden');
    setTimeout(() => {
        playerContainer.classList.add('visible');
    }, 250);
}

// Auto-close splash after 3 seconds
setTimeout(closeSplash, 7000);
