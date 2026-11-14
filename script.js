const canvas = document.querySelector('#sequence');
const context = canvas.getContext('2d', { alpha: false });
const portraitLayer = document.createElement('canvas');
const portraitContext = portraitLayer.getContext('2d');
const header = document.querySelector('.topbar');
const menuButton = document.querySelector('.menu-toggle');
const frameCount = 240;
const framePath = 'assets/cinematic-frames-final/';
const frames = Array.from({ length: frameCount }, (imageValue, index) => {
  const image = new Image();
  image.decoding = 'async';
  image.addEventListener('load', () => {
    if (Math.abs(displayedFrame - index) < 1.5) renderFrame(true);
  });
  return image;
});
frames.forEach((image, index) => {
  image.src = `${framePath}frame-${String(index + 1).padStart(4, '0')}.webp`;
});

let targetFrame = 0;
let displayedFrame = 0;
let lastRenderedPosition = -1;
let canvasWidth = 0;
let canvasHeight = 0;
let animationRequest = 0;
let previousTimestamp = 0;
let lastPrimedFrame = -Infinity;
const decodeRequests = new Map();
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function closeMenu() {
  header.classList.remove('menu-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
}

menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  header.classList.toggle('menu-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});

document.querySelectorAll('.main-nav a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

function loadFrame(index) {
  const image = frames[index];
  if (!image.getAttribute('src')) image.src = `${framePath}frame-${String(index + 1).padStart(4, '0')}.webp`;
  return image;
}

function primeFrames(center) {
  if (Math.abs(center - lastPrimedFrame) < 2) return;
  lastPrimedFrame = center;
  const direction = Math.sign(targetFrame - displayedFrame) || 1;
  const indices = [center];
  for (let offset = 1; offset <= 12; offset += 1) indices.push(center + offset * direction);
  for (let offset = 1; offset <= 4; offset += 1) indices.push(center - offset * direction);
  indices.forEach((index) => {
    if (index < 0 || index >= frameCount || decodeRequests.has(index)) return;
    const request = loadFrame(index).decode().catch(() => {}).finally(() => decodeRequests.delete(index));
    decodeRequests.set(index, request);
  });
}

function scheduleAnimation() {
  if (!animationRequest) animationRequest = requestAnimationFrame(animate);
}

function renderFrame(force = false) {
  const position = Math.max(0, Math.min(frameCount - 1, displayedFrame));
  if (!force && Math.abs(position - lastRenderedPosition) < 0.002) return;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.min(frameCount - 1, lowerIndex + 1);
  const blend = position - lowerIndex;
  let frameIndex = lowerIndex;
  let image = frames[lowerIndex];
  const lowerReady = image?.complete && image.naturalWidth;
  const nextImage = frames[upperIndex];
  const upperReady = nextImage?.complete && nextImage.naturalWidth;
  if (!lowerReady) {
    const wantedFrame = Math.round(position);
    const direction = Math.sign(targetFrame - displayedFrame) || 1;
    for (let offset = 1; offset <= 3; offset += 1) {
      const ahead = wantedFrame + offset * direction;
      const behind = wantedFrame - offset * direction;
      const aheadImage = frames[ahead];
      const behindImage = frames[behind];
      if (aheadImage?.complete && aheadImage.naturalWidth) {
        frameIndex = ahead;
        image = aheadImage;
        break;
      }
      if (behindImage?.complete && behindImage.naturalWidth) {
        frameIndex = behind;
        image = behindImage;
        break;
      }
    }
  }
  if (!image?.complete || !image.naturalWidth || !canvasWidth || !canvasHeight) return;

  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  const portraitViewport = canvasHeight / canvasWidth > 1.1;
  drawFramedImage(image, portraitViewport);
  if (lowerReady && upperReady && upperIndex !== lowerIndex && blend > 0.001) {
    context.globalAlpha = blend;
    drawFramedImage(nextImage);
    context.globalAlpha = 1;
  }
  if (!portraitViewport) drawWordmark();
  lastRenderedPosition = position;
}

function drawFramedImage(image, includeWordmark = false) {
  const coverScale = Math.max(canvasWidth / image.naturalWidth, canvasHeight / image.naturalHeight);
  const portraitViewport = canvasHeight / canvasWidth > 1.1;
  if (!portraitViewport) {
    const width = image.naturalWidth * coverScale;
    const height = image.naturalHeight * coverScale;
    context.drawImage(image, (canvasWidth - width) / 2, (canvasHeight - height) / 2, width, height);
    return;
  }

  const coverWidth = image.naturalWidth * coverScale;
  const coverHeight = image.naturalHeight * coverScale;
  context.save();
  context.filter = `blur(${Math.round(canvasWidth * 0.035)}px) brightness(.38)`;
  context.drawImage(image, (canvasWidth - coverWidth) / 2, (canvasHeight - coverHeight) / 2, coverWidth, coverHeight);
  context.restore();
  if (includeWordmark) drawWordmark();

  const portraitScale = canvasWidth <= 600 ? 2 : 1.7;
  const fitScale = Math.min(canvasWidth / image.naturalWidth, canvasHeight / image.naturalHeight) * portraitScale;
  const width = image.naturalWidth * fitScale;
  const height = image.naturalHeight * fitScale;
  const portraitCenterY = canvasHeight * (canvasWidth <= 350 ? 0.82 : canvasWidth <= 600 ? 0.66 : 0.43);
  const top = portraitCenterY - height / 2;
  portraitContext.clearRect(0, 0, canvasWidth, canvasHeight);
  portraitContext.drawImage(image, (canvasWidth - width) / 2, top, width, height);
  const edgeFade = Math.min(height * 0.14, canvasHeight * 0.08);
  const mask = portraitContext.createLinearGradient(0, top, 0, top + height);
  mask.addColorStop(0, 'rgba(0,0,0,0)');
  mask.addColorStop(edgeFade / height, 'rgba(0,0,0,1)');
  mask.addColorStop(1 - edgeFade / height, 'rgba(0,0,0,1)');
  mask.addColorStop(1, 'rgba(0,0,0,0)');
  portraitContext.globalCompositeOperation = 'destination-in';
  portraitContext.fillStyle = mask;
  portraitContext.fillRect(0, top, canvasWidth, height);
  portraitContext.globalCompositeOperation = 'source-over';
  context.drawImage(portraitLayer, 0, 0);
}

function drawWordmark() {
  const fontSize = Math.min(canvasWidth * 0.225, canvasHeight * 0.38);
  if (!fontSize) return;
  context.save();
  context.font = `900 ${fontSize}px Arial, sans-serif`;
  context.textAlign = 'right';
  context.textBaseline = 'middle';
  context.lineJoin = 'round';
  context.lineWidth = Math.max(1, fontSize * 0.004);
  context.globalAlpha = 0.5;
  context.strokeStyle = '#ff1749';
  context.strokeText('BUILT', canvasWidth * 0.97, canvasHeight * 0.42);
  context.globalAlpha = 0.12;
  context.fillStyle = '#ff1749';
  context.fillText('BUILT', canvasWidth * 0.97, canvasHeight * 0.42);
  context.restore();
}

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);
  canvasWidth = Math.round(bounds.width * pixelRatio);
  canvasHeight = Math.round(bounds.height * pixelRatio);
  if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    portraitLayer.width = canvasWidth;
    portraitLayer.height = canvasHeight;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    lastRenderedPosition = -1;
  }
  renderFrame(true);
  scheduleAnimation();
}

function updateScrollTarget() {
  const range = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const progress = Math.max(0, Math.min(1, window.scrollY / range));
  targetFrame = progress * (frameCount - 1);
  primeFrames(Math.round(targetFrame));
  scheduleAnimation();
}

function animate(timestamp) {
  animationRequest = 0;
  const distance = targetFrame - displayedFrame;
  if (Math.abs(distance) > 0.015) {
    const elapsed = previousTimestamp ? Math.min((timestamp - previousTimestamp) / 1000, 0.05) : 1 / 60;
    displayedFrame += distance * (reduceMotion ? 1 : 1 - Math.exp(-52 * elapsed));
    renderFrame();
    scheduleAnimation();
  } else if (displayedFrame !== targetFrame) {
    displayedFrame = targetFrame;
    renderFrame();
  }
  previousTimestamp = timestamp;
}

window.addEventListener('resize', () => {
  resizeCanvas();
  updateScrollTarget();
}, { passive: true });
window.addEventListener('scroll', updateScrollTarget, { passive: true });
window.addEventListener('load', updateScrollTarget, { once: true });
frames[0].addEventListener('load', resizeCanvas, { once: true });
loadFrame(0).decode().then(resizeCanvas).catch(() => {});
resizeCanvas();
updateScrollTarget();
