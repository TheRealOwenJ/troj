const btn = document.getElementById('bgmbtn');
const bgm = document.getElementById('bgm');

btn.addEventListener('click', () => {
    if (bgm.paused) {
        bgm.play();
    } else {
        bgm.pause();
    }
});