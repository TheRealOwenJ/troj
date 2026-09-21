const btn = document.getElementById('bgmbtn');
const bgm = document.getElementById('bgm');
const container = document.getElementById("carContainer");
const musicPlayer = document.getElementById("musicPlayer");
const closePlayer = document.getElementById("closePlayer");
const playPause = document.getElementById("playPause");
const previousTrack = document.getElementById("previousTrack");
const nextTrack = document.getElementById("nextTrack");
const trackTitle = document.getElementById("trackTitle");
const trackTime = document.getElementById("trackTime");
const currentTime = document.getElementById("currentTime");
const seekBar = document.getElementById("seekBar");
const volumeBar = document.getElementById("volumeBar");
const visualizer = document.getElementById("visualizer");
const visualizerContext = visualizer.getContext("2d");
const trackList = document.getElementById("trackList");
const killCount = document.getElementById("killCount");

let isMusicMode = false;
let revealTimer;
let currentTrack = 0;
let tracks = [];
let trackButtons = [];
let audioContext;
let analyser;
let visualizerData;

let car = document.getElementById("car");
let x = -150;
let direction = 1;
let speed = 4;
let isExploding = false;
let explosionCount = 0;
let y = 0;
let verticalVelocity = 0;
let rotation = 0;
let rocketUntil = 0;

const scatterTargets = [
    document.getElementById('imageBox'),
    document.getElementById('titleBox'),
    document.getElementById('content'),
    document.getElementById('carContainer')
];

btn.addEventListener('click', () => {
    if (!isMusicMode) {
        isMusicMode = true;
        document.documentElement.classList.add("music-mode");
        document.body.classList.add("music-mode");
        scatterTargets.forEach(el => el.classList.add('scatter-element'));
        revealTimer = setTimeout(() => {
            musicPlayer.classList.add('visible');
        }, 2000);
    } else {
        isMusicMode = false;
        document.documentElement.classList.remove("music-mode");
        document.body.classList.remove("music-mode");
        clearTimeout(revealTimer);
        scatterTargets.forEach(el => el.classList.remove('scatter-element'));
        musicPlayer.classList.remove('visible');
    }
});

function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "00:00";
    const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
    const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainder}`;
}

function selectTrack(trackIndex, shouldPlay = false) {
    if (!tracks.length) return;
    currentTrack = (trackIndex + tracks.length) % tracks.length;
    bgm.src = tracks[currentTrack].source;
    bgm.load();
    trackTitle.textContent = tracks[currentTrack].title;
    playPause.textContent = "play";
    seekBar.value = 0;
    currentTime.textContent = "00:00";
    trackButtons.forEach(button => {
        button.classList.toggle("active", Number(button.dataset.track) === currentTrack);
    });
    if (shouldPlay) {
        startAudio();
    }
}

function titleFromFilename(filename) {
    return filename
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]+/g, " ")
        .toLowerCase();
}

function renderTrackList() {
    trackList.replaceChildren();
    if (!tracks.length) {
        const message = document.createElement("span");
        message.textContent = "NO AUDIO FILES FOUND";
        trackList.appendChild(message);
        return;
    }

    tracks.forEach((track, index) => {
        const button = document.createElement("button");
        button.className = "trackButton";
        button.type = "button";
        button.dataset.track = index;
        button.textContent = `${String(index + 1).padStart(2, "0")} // ${track.title}`;
        button.addEventListener("click", () => selectTrack(index, true));
        trackList.appendChild(button);
    });
    trackButtons = trackList.querySelectorAll(".trackButton");
}

async function scanMusicFolder() {
    try {
        const response = await fetch("bgm/", { cache: "no-store" });
        if (!response.ok) throw new Error("The bgm folder could not be read.");
        const folder = new DOMParser().parseFromString(await response.text(), "text/html");
        const audioExtensions = /\.(mp3|wav|ogg|m4a|aac|flac)$/i;
        tracks = [...folder.querySelectorAll("a[href]")]
            .map(link => link.getAttribute("href"))
            .filter(source => source && audioExtensions.test(source))
            .map(source => {
                const filename = decodeURIComponent(source.split("/").pop());
                return { title: titleFromFilename(filename), source: `bgm/${filename}` };
            })
            .sort((first, second) => first.title.localeCompare(second.title));
    } catch (error) {
        trackList.replaceChildren();
        const message = document.createElement("span");
        message.textContent = "RUN THIS SITE THROUGH A WEB SERVER TO SCAN BGM";
        trackList.appendChild(message);
        return;
    }

    renderTrackList();
    selectTrack(0);
}

function startAudio() {
    if (!audioContext) {
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 128;
        const source = audioContext.createMediaElementSource(bgm);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        visualizerData = new Uint8Array(analyser.frequencyBinCount);
    }
    audioContext.resume();
    bgm.play();
}

playPause.addEventListener("click", () => {
    if (bgm.paused) {
        startAudio();
    } else {
        bgm.pause();
    }
});

previousTrack.addEventListener("click", () => selectTrack(currentTrack - 1, true));
nextTrack.addEventListener("click", () => selectTrack(currentTrack + 1, true));
closePlayer.addEventListener("click", () => {
    bgm.pause();
    isMusicMode = false;
    document.documentElement.classList.remove("music-mode");
    document.body.classList.remove("music-mode");
    clearTimeout(revealTimer);
    scatterTargets.forEach(el => el.classList.remove('scatter-element'));
    musicPlayer.classList.remove('visible');
});

bgm.addEventListener("loadedmetadata", () => {
    trackTime.textContent = formatTime(bgm.duration);
});
bgm.addEventListener("timeupdate", () => {
    currentTime.textContent = formatTime(bgm.currentTime);
    seekBar.value = bgm.duration ? (bgm.currentTime / bgm.duration) * 100 : 0;
});
bgm.addEventListener("play", () => { playPause.textContent = "pause"; });
bgm.addEventListener("pause", () => { playPause.textContent = "play"; });
bgm.addEventListener("ended", () => selectTrack(currentTrack + 1, true));
seekBar.addEventListener("input", () => {
    if (bgm.duration) bgm.currentTime = (Number(seekBar.value) / 100) * bgm.duration;
});
volumeBar.addEventListener("input", () => { bgm.volume = Number(volumeBar.value); });

function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);
    const width = visualizer.width;
    const height = visualizer.height;
    visualizerContext.fillStyle = "blue";
    visualizerContext.fillRect(0, 0, width, height);
    if (analyser) analyser.getByteFrequencyData(visualizerData);
    const barCount = 48;
    const barWidth = width / barCount;
    for (let index = 0; index < barCount; index += 1) {
        const value = analyser ? visualizerData[index] / 255 : 0.04;
        const barHeight = Math.max(4, value * height * 0.9);
        visualizerContext.fillStyle = "white";
        visualizerContext.fillRect(index * barWidth + 2, height - barHeight, barWidth - 4, barHeight);
    }
}

bgm.volume = Number(volumeBar.value);
scanMusicFolder();
drawVisualizer();

const kaboomSound = new Audio("sfx/kaboom.mp3");
const carSound = new Audio("sfx/car.mp3");
const clickSound = new Audio("sfx/click.mp3");
carSound.loop = true;

document.addEventListener("click", event => {
    if (!event.target.closest("button, a")) return;
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
});

function setCarSound(isRotating) {
    if (isRotating) {
        if (carSound.paused) carSound.play().catch(() => {});
    } else if (!carSound.paused) {
        carSound.pause();
        carSound.currentTime = 0;
    }
}

function updateCarTransform() {
    car.style.transform = `scaleX(${direction}) rotate(${rotation}deg)`;
    car.style.bottom = `${y}px`;
}

function spawnCar() {
    const spawnFromLeft = Math.random() < 0.5;
    x = spawnFromLeft ? -150 : container.clientWidth;
    direction = spawnFromLeft ? 1 : -1;
    y = 0;
    verticalVelocity = 0;
    rotation = 0;
    rocketUntil = 0;
    setCarSound(false);
    car.style.left = `${x}px`;
    updateCarTransform();
}

car.addEventListener('click', () => {
    if (isExploding) return;
    isExploding = true;
    explosionCount += 1;
    killCount.textContent = `killcount: ${explosionCount}`;
    if (explosionCount === 3) {
        killCount.classList.add("visible");
    }
    rocketUntil = 0;
    setCarSound(false);
    kaboomSound.currentTime = 0;
    kaboomSound.play();
    car.src = "images/kaboom.gif";
    car.style.transform = "scaleX(1)";

    setTimeout(() => {
        car.style.display = "none";

        setTimeout(() => {
            spawnCar();
            car.src = "images/car.png";
            car.style.display = "block";
            isExploding = false;
        }, 500);
    }, 800);
});

function drive() {
    if (!isExploding) {
        const now = performance.now();
        const aggressiveSpeed = speed + explosionCount * 1.2;
        const isRocket = now < rocketUntil;
        setCarSound(isRocket);
        x += aggressiveSpeed * direction * (isRocket ? 2.4 : 1);

        if (isRocket) {
            y += verticalVelocity;
            verticalVelocity += 0.35;
            rotation += 12 * direction;

            if (y > container.clientHeight - 90) {
                y = container.clientHeight - 90;
                verticalVelocity = -Math.abs(verticalVelocity) * 0.9;
            }

            if (y < 0) {
                y = 0;
                verticalVelocity = Math.abs(verticalVelocity) + 2;
            }

            if (Math.random() < 0.025 + explosionCount * 0.004) {
                direction *= -1;
            }
        } else {
            y = 0;
            rotation = 0;
        }

        const maxX = container.clientWidth;

        if (x > maxX) {
            x = -150;
            direction = 1;
        }

        if (x < -150) {
            x = maxX;
            direction = -1;
        }

        car.style.left = `${x}px`;
        updateCarTransform();
    }

    requestAnimationFrame(drive);
}

function randomDrift() {
    const turnChance = Math.min(0.5, 0.2 + explosionCount * 0.06);
    if (Math.random() < turnChance) {
        direction *= -1;
    }

    if (explosionCount > 0 && Math.random() < Math.min(0.15 + explosionCount * 0.05, 0.65)) {
        rocketUntil = performance.now() + 1200 + Math.random() * 1800;
        verticalVelocity = -7 - explosionCount * 0.5;
    }

    updateCarTransform();
    const nextTurn = Math.max(350, 3000 - explosionCount * 220) + Math.random() * 1800;
    setTimeout(randomDrift, nextTurn);
}

spawnCar();
drive();
randomDrift();