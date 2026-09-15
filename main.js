const btn = document.getElementById('bgmbtn');
const bgm = document.getElementById('bgm');
const car = document.getElementById("car");
const container = document.getElementById("carContainer");

let x = -150;
let direction = 1;
let speed = 4;

btn.addEventListener('click', () => {
    if (bgm.paused) {
        bgm.play();
    } else {
        bgm.pause();
    }
});

function drive() {
    x += speed * direction;

    const maxX = container.clientWidth;

    if (x > maxX) {
        x = -150;
        direction = 1;
        car.style.transform = "scaleX(1)";
    }

    if (x < -150) {
        x = maxX;
        direction = -1;
        car.style.transform = "scaleX(-1)";
    }

    car.style.left = `${x}px`;

    requestAnimationFrame(drive);
}

function randomDrift() {
    if (Math.random() < 0.5) {
        direction *= -1;
        car.style.transform = `scaleX(${direction})`;
    }

    setTimeout(randomDrift, 2000 + Math.random() * 5000);
}

drive();
randomDrift();