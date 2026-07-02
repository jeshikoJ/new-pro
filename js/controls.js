import { targetCameraPos, targetCameraTarget, KEYFRAMES, setFovWarpTarget } from './camera.js';

export let cursorX = 0, cursorY = 0;
export let followerX = 0, followerY = 0;
export let mouseX = 0, mouseY = 0;
export let lastScrollTop = 0;

const SECTION_PLANETS = [
    "SUN / HOME",
    "VENUS / PROFILE",
    "EARTH & MOON / SKILLS",
    "MARS / EXPERIENCE",
    "JUPITER / PROJECTS",
    "SATURN / CREDENTIALS",
    "DEEP SPACE / SYSTEM OVERVIEW"
];

export function updateCameraPath(progress) {
    const maxVal = KEYFRAMES.length - 1;
    const progressClamped = Math.max(0, Math.min(progress, maxVal));
    
    const i = Math.floor(progressClamped);
    const f = progressClamped - i;
    
    if (i >= maxVal) {
        targetCameraPos.copy(KEYFRAMES[maxVal].pos);
        targetCameraTarget.copy(KEYFRAMES[maxVal].lookAt);
    } else {
        targetCameraPos.lerpVectors(KEYFRAMES[i].pos, KEYFRAMES[i + 1].pos, f);
        targetCameraTarget.lerpVectors(KEYFRAMES[i].lookAt, KEYFRAMES[i + 1].lookAt, f);
    }
    
    const planetIdx = Math.min(Math.floor(progressClamped + 0.35), SECTION_PLANETS.length - 1);
    const planetIndicator = document.getElementById('active-planet-name');
    if (planetIndicator) {
        planetIndicator.textContent = SECTION_PLANETS[planetIdx];
    }
}

export function handleScroll() {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;
    
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollPercent = scrollTop / scrollHeight;
    
    const scrollVelocity = Math.abs(scrollTop - lastScrollTop);
    lastScrollTop = scrollTop;
    
    setFovWarpTarget(45 + Math.min(scrollVelocity * 0.18, 14));
    
    const progress = scrollPercent * (KEYFRAMES.length - 1);
    updateCameraPath(progress);
    
    const activeSectionIndex = Math.min(Math.round(progress), KEYFRAMES.length - 1);
    const navAnchors = document.querySelectorAll('.nav-links a');
    navAnchors.forEach((anchor, idx) => {
        if (idx === activeSectionIndex) {
            anchor.classList.add('active');
        } else {
            anchor.classList.remove('active');
        }
    });
}

export function onMouseMove(event) {
    mouseX = (event.clientX - window.innerWidth / 2) / 100;
    mouseY = (event.clientY - window.innerHeight / 2) / 100;
    
    cursorX = event.clientX;
    cursorY = event.clientY;
    
    const dot = document.getElementById('custom-cursor-dot');
    const cursor = document.getElementById('custom-cursor');
    if (dot && cursor) {
        dot.style.left = cursorX + 'px';
        dot.style.top = cursorY + 'px';
        dot.style.opacity = '1';
        cursor.style.opacity = '1';
    }
}

export function updateCursorFollower() {
    followerX += (cursorX - followerX) * 0.12;
    followerY += (cursorY - followerY) * 0.12;
    
    const cursor = document.getElementById('custom-cursor');
    if (cursor) {
        cursor.style.left = followerX + 'px';
        cursor.style.top = followerY + 'px';
    }
    requestAnimationFrame(updateCursorFollower);
}

export function setupCardTilts() {
    const cards = document.querySelectorAll('.panel-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const rotateX = -((y / rect.height) - 0.5) * 16;
            const rotateY = ((x / rect.width) - 0.5) * 16;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`;
            card.style.transition = 'none';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        });
    });
}

const TYPING_ROLES = [
    "a Software Engineer.",
    "a Full-Stack Developer.",
    "a Cloud & DevOps Specialist.",
    "scalable web architectures."
];
let roleIdx = 0;
let charIdx = 0;
let isDeleting = false;

export function typeEffect() {
    const typingText = document.getElementById('typing-text');
    if (!typingText) return;
    
    const currentRole = TYPING_ROLES[roleIdx];
    if (isDeleting) {
        typingText.textContent = currentRole.substring(0, charIdx - 1);
        charIdx--;
    } else {
        typingText.textContent = currentRole.substring(0, charIdx + 1);
        charIdx++;
    }
    
    let typeSpeed = isDeleting ? 30 : 70;
    
    if (!isDeleting && charIdx === currentRole.length) {
        typeSpeed = 1800;
        isDeleting = true;
    } else if (isDeleting && charIdx === 0) {
        isDeleting = false;
        roleIdx = (roleIdx + 1) % TYPING_ROLES.length;
        typeSpeed = 400;
    }
    
    setTimeout(typeEffect, typeSpeed);
}

// Bind to window so inline HTML onclick calls function
window.switchSkillsTab = function(tabId) {
    const tabContents = document.querySelectorAll('.skills-tab-content');
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabContents.forEach(content => content.classList.remove('active'));
    tabBtns.forEach(btn => btn.classList.remove('active'));
    
    const targetTab = document.getElementById(`tab-${tabId}`);
    if (targetTab) targetTab.classList.add('active');
    
    tabBtns.forEach(btn => {
        const onClickAttr = btn.getAttribute('onclick') || '';
        if (onClickAttr.includes(tabId)) {
            btn.classList.add('active');
        }
    });
};
