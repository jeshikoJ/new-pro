/* ==========================================================================
   THREE.JS SPACE & BACKGROUND SYSTEM
   ========================================================================== */

// Global scene components
let scene, camera, renderer;
let sun, mercury, venus, earth, clouds, moon, mars, jupiter, saturn, saturnRings, uranus, neptune;
let orbitLines = [];
let stars, asteroids;
let mouseX = 0, mouseY = 0;

// Camera pathing variables
const currentCameraPos = new THREE.Vector3(0, 10, 50);
const currentCameraTarget = new THREE.Vector3(0, 0, 0);
const targetCameraPos = new THREE.Vector3(0, 10, 50);
const targetCameraTarget = new THREE.Vector3(0, 0, 0);

// FOV Warp speed parameters on scroll
let fovWarpTarget = 45;
let lastScrollTop = 0;

// Custom Cursor variables
let cursorX = 0, cursorY = 0;
let followerX = 0, followerY = 0;

// Define celestial coordinates (X, Y, Z relative to Sun at 0,0,0)
const PLANET_POSITIONS = {
    sun: new THREE.Vector3(0, 0, 0),
    mercury: new THREE.Vector3(-12, 0, 10),
    venus: new THREE.Vector3(18, 0, -5),
    earth: new THREE.Vector3(-6, 0, -45),
    mars: new THREE.Vector3(-24, 0, -85),
    jupiter: new THREE.Vector3(38, 0, -135),
    saturn: new THREE.Vector3(-34, 0, -195),
    uranus: new THREE.Vector3(45, 0, -250),
    neptune: new THREE.Vector3(-48, 0, -305)
};

// Keyframes matching scroll sections (Progress indices 0 to 6)
const KEYFRAMES = [
    {   // 0. Home: Wide Solar System view looking at the Sun
        pos: new THREE.Vector3(0, 15, 60), 
        lookAt: new THREE.Vector3(0, 0, 0)
    },
    {   // 1. Profile (Venus focus, text float right - planet on left)
        pos: new THREE.Vector3(25, 2, -3), 
        lookAt: new THREE.Vector3(12, 0, -5)
    },
    {   // 2. Skills (Earth & Moon focus, text float left - planet on right)
        pos: new THREE.Vector3(-15, 1, -40), 
        lookAt: new THREE.Vector3(-6, 0, -45)
    },
    {   // 3. Experience (Mars focus, text float right - planet on left)
        pos: new THREE.Vector3(-32, 1.5, -83), 
        lookAt: new THREE.Vector3(-20, 0, -85)
    },
    {   // 4. Projects (Jupiter focus, text float left - planet on right)
        pos: new THREE.Vector3(26, 4, -130), 
        lookAt: new THREE.Vector3(38, 0, -135)
    },
    {   // 5. Certifications (Saturn focus, text float right - planet on left)
        pos: new THREE.Vector3(-45, 6, -190), 
        lookAt: new THREE.Vector3(-30, 0, -195)
    },
    {   // 6. Contact (Wide overview pull-back looking towards inner solar system)
        pos: new THREE.Vector3(-70, 50, -160), 
        lookAt: new THREE.Vector3(0, 0, -100)
    }
];

// Planet names for indicator
const SECTION_PLANETS = [
    "SUN / HOME",
    "VENUS / PROFILE",
    "EARTH & MOON / SKILLS",
    "MARS / EXPERIENCE",
    "JUPITER / PROJECTS",
    "SATURN / CREDENTIALS",
    "DEEP SPACE / SYSTEM OVERVIEW"
];

// Initialize WebGL application
function initThree() {
    const canvas = document.getElementById('bg-canvas');
    
    // Scene setup
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030308, 0.002);
    
    // Camera setup
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.copy(currentCameraPos);
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
    scene.add(ambientLight);
    
    // Sun light (Point light casting outward)
    const sunLight = new THREE.PointLight(0xfff3d6, 1.8, 400, 0.5);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);
    
    // Subtle distant blue fill lights for nebulous space feel
    const spaceLight1 = new THREE.DirectionalLight(0x00f2fe, 0.1);
    spaceLight1.position.set(100, 50, -100);
    scene.add(spaceLight1);
    const spaceLight2 = new THREE.DirectionalLight(0x7f00ff, 0.05);
    spaceLight2.position.set(-100, -50, -200);
    scene.add(spaceLight2);
    
    // Create cosmic entities
    createStarfield();
    createCelestialBodies();
    createAsteroidBelt();
    createOrbitRings();
    
    // Initial camera update
    updateCameraPath(0);
    
    // Event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
}

/* ==========================================================================
   PROCEDURAL CELESTIAL TEXTURE GENERATION
   ========================================================================== */

function generateProceduralTexture(type, colorBase, colorDetail) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    if (type === 'sun') {
        const grad = ctx.createLinearGradient(0, 0, 512, 0);
        grad.addColorStop(0, '#ffcc00');
        grad.addColorStop(0.3, '#ff6600');
        grad.addColorStop(0.6, '#ff3300');
        grad.addColorStop(1, '#ffcc00');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 256);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        for (let i = 0; i < 40; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * 512, Math.random() * 256, Math.random() * 40 + 10, 0, Math.PI * 2);
            ctx.fill();
        }
    } 
    else if (type === 'bands') {
        ctx.fillStyle = colorBase;
        ctx.fillRect(0, 0, 512, 256);
        
        for (let y = 0; y < 256; y += Math.random() * 15 + 5) {
            ctx.fillStyle = Math.random() > 0.5 ? colorDetail : 'rgba(255,255,255,0.08)';
            ctx.fillRect(0, y, 512, Math.random() * 10 + 2);
        }
        if (colorDetail === '#d14905') { // Jupiter Red Spot
            ctx.fillStyle = '#b32b00';
            ctx.beginPath();
            ctx.ellipse(320, 160, 35, 20, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    } 
    else if (type === 'cratered') {
        ctx.fillStyle = colorBase;
        ctx.fillRect(0, 0, 512, 256);
        
        ctx.fillStyle = colorDetail;
        for (let i = 0; i < 3000; i++) {
            ctx.fillRect(Math.random() * 512, Math.random() * 256, Math.random() * 2 + 1, Math.random() * 2 + 1);
        }
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        for (let i = 0; i < 40; i++) {
            const rx = Math.random() * 512;
            const ry = Math.random() * 256;
            const r = Math.random() * 15 + 3;
            ctx.beginPath();
            ctx.arc(rx, ry, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
    }
    else if (type === 'earth') {
        ctx.fillStyle = '#0d2b45';
        ctx.fillRect(0, 0, 512, 256);
        
        ctx.fillStyle = '#203c20';
        ctx.beginPath();
        // Eurasia/Africa
        ctx.arc(100, 100, 45, 0, Math.PI * 2);
        ctx.arc(140, 120, 35, 0, Math.PI * 2);
        ctx.arc(180, 100, 55, 0, Math.PI * 2);
        ctx.arc(120, 170, 25, 0, Math.PI * 2);
        // Americas
        ctx.arc(360, 90, 40, 0, Math.PI * 2);
        ctx.arc(380, 160, 35, 0, Math.PI * 2);
        ctx.arc(340, 70, 30, 0, Math.PI * 2);
        // Australia
        ctx.arc(260, 170, 20, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 512, 25);
        ctx.fillRect(0, 235, 512, 21);
    }
    else if (type === 'clouds') {
        ctx.clearRect(0, 0, 512, 256);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        for (let i = 0; i < 35; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * 512, Math.random() * 120 + 60, Math.random() * 35 + 10, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
}

function generateSaturnRingTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, 'rgba(168, 142, 107, 0.0)');
    grad.addColorStop(0.2, 'rgba(195, 175, 145, 0.9)');
    grad.addColorStop(0.5, 'rgba(120, 110, 95, 0.1)');
    grad.addColorStop(0.65, 'rgba(180, 160, 130, 0.85)');
    grad.addColorStop(0.85, 'rgba(150, 130, 100, 0.5)');
    grad.addColorStop(1.0, 'rgba(168, 142, 107, 0.0)');
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 16);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

/* ==========================================================================
   COSMIC ENTITY CREATION
   ========================================================================== */

function createStarfield() {
    const starCount = 3000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 800;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 800;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 800;
        
        const rand = Math.random();
        if (rand > 0.8) {
            colors[i * 3] = 0.0;
            colors[i * 3 + 1] = 0.95;
            colors[i * 3 + 2] = 1.0;
        } else if (rand > 0.65) {
            colors[i * 3] = 0.5;
            colors[i * 3 + 1] = 0.0;
            colors[i * 3 + 2] = 0.9;
        } else {
            colors[i * 3] = 1.0;
            colors[i * 3 + 1] = 1.0;
            colors[i * 3 + 2] = 1.0;
        }
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
        size: 0.95,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        sizeAttenuation: true
    });
    
    stars = new THREE.Points(geometry, material);
    scene.add(stars);
}

function createAsteroidBelt() {
    const asteroidCount = 1800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(asteroidCount * 3);
    
    for (let i = 0; i < asteroidCount; i++) {
        const radius = 10 + Math.random() * 18;
        const angle = Math.random() * Math.PI * 2;
        
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
        positions[i * 3 + 2] = -110 + Math.sin(angle) * radius;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        size: 0.25,
        color: 0x887766,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true
    });
    
    asteroids = new THREE.Points(geometry, material);
    scene.add(asteroids);
}

function createOrbitRings() {
    const material = new THREE.LineBasicMaterial({
        color: 0x00f2fe,
        transparent: true,
        opacity: 0.08
    });
    
    Object.keys(PLANET_POSITIONS).forEach(name => {
        if (name === 'sun') return;
        
        const pos = PLANET_POSITIONS[name];
        const radius = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
        
        const segments = 128;
        const geometry = new THREE.BufferGeometry();
        const points = [];
        
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, pos.z));
        }
        
        geometry.setFromPoints(points);
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        orbitLines.push(line);
    });
}

function createCelestialBodies() {
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    
    // 1. SUN
    const sunTexture = generateProceduralTexture('sun');
    const sunMat = new THREE.MeshBasicMaterial({ map: sunTexture });
    sun = new THREE.Mesh(new THREE.SphereGeometry(4.5, 32, 32), sunMat);
    sun.position.copy(PLANET_POSITIONS.sun);
    scene.add(sun);
    
    // 2. MERCURY
    const mercTexture = generateProceduralTexture('cratered', '#55555c', '#2c2c2f');
    const mercMat = new THREE.MeshStandardMaterial({ map: mercTexture, roughness: 0.9, metalness: 0.1 });
    mercury = new THREE.Mesh(sphereGeometry, mercMat);
    mercury.scale.setScalar(0.4);
    mercury.position.copy(PLANET_POSITIONS.mercury);
    scene.add(mercury);
    
    // 3. VENUS
    const venTexture = generateProceduralTexture('bands', '#e6a15c', '#8a5016');
    const venMat = new THREE.MeshStandardMaterial({ map: venTexture, roughness: 0.8 });
    venus = new THREE.Mesh(sphereGeometry, venMat);
    venus.scale.setScalar(0.9);
    venus.position.copy(PLANET_POSITIONS.venus);
    scene.add(venus);
    
    // 4. EARTH & MOON
    const earthTexture = generateProceduralTexture('earth');
    const earthMat = new THREE.MeshStandardMaterial({ map: earthTexture, roughness: 0.6, metalness: 0.1 });
    earth = new THREE.Mesh(sphereGeometry, earthMat);
    earth.scale.setScalar(1.0);
    earth.position.copy(PLANET_POSITIONS.earth);
    scene.add(earth);
    
    // Earth Clouds
    const cloudTexture = generateProceduralTexture('clouds');
    const cloudMat = new THREE.MeshStandardMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: 0.45,
        blending: THREE.NormalBlending
    });
    clouds = new THREE.Mesh(new THREE.SphereGeometry(1.02, 32, 32), cloudMat);
    earth.add(clouds);
    
    // Moon
    const moonTexture = generateProceduralTexture('cratered', '#8c8c8c', '#404040');
    const moonMat = new THREE.MeshStandardMaterial({ map: moonTexture, roughness: 0.9 });
    moon = new THREE.Mesh(sphereGeometry, moonMat);
    moon.scale.setScalar(0.24);
    scene.add(moon);
    
    // 5. MARS
    const marsTexture = generateProceduralTexture('cratered', '#c1440e', '#591603');
    const marsMat = new THREE.MeshStandardMaterial({ map: marsTexture, roughness: 0.85 });
    mars = new THREE.Mesh(sphereGeometry, marsMat);
    mars.scale.setScalar(0.7);
    mars.position.copy(PLANET_POSITIONS.mars);
    scene.add(mars);
    
    // 6. JUPITER
    const jupTexture = generateProceduralTexture('bands', '#d8ca9d', '#d14905');
    const jupMat = new THREE.MeshStandardMaterial({ map: jupTexture, roughness: 0.6 });
    jupiter = new THREE.Mesh(sphereGeometry, jupMat);
    jupiter.scale.setScalar(2.2);
    jupiter.position.copy(PLANET_POSITIONS.jupiter);
    scene.add(jupiter);
    
    // 7. SATURN & RINGS
    const satTexture = generateProceduralTexture('bands', '#e2bf7d', '#b19159');
    const satMat = new THREE.MeshStandardMaterial({ map: satTexture, roughness: 0.75 });
    saturn = new THREE.Mesh(sphereGeometry, satMat);
    saturn.scale.setScalar(1.85);
    saturn.position.copy(PLANET_POSITIONS.saturn);
    scene.add(saturn);
    
    // Rings
    const ringGeo = new THREE.RingGeometry(1.4, 2.5, 64);
    const posAttribute = ringGeo.attributes.position;
    const uvAttribute = ringGeo.attributes.uv;
    for (let i = 0; i < posAttribute.count; i++) {
        const x = posAttribute.getX(i);
        const y = posAttribute.getY(i);
        const distance = Math.sqrt(x*x + y*y);
        const u = (distance - 1.4) / (2.5 - 1.4);
        uvAttribute.setXY(i, u, 0.5);
    }
    
    const ringTex = generateSaturnRingTexture();
    const ringMat = new THREE.MeshStandardMaterial({
        map: ringTex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
        roughness: 0.5
    });
    saturnRings = new THREE.Mesh(ringGeo, ringMat);
    saturnRings.rotation.x = Math.PI * 0.45;
    saturnRings.rotation.y = Math.PI * 0.1;
    saturn.add(saturnRings);
    
    // 8. URANUS
    const uranusTexture = generateProceduralTexture('bands', '#a8e1e6', '#72b6bd');
    const uranusMat = new THREE.MeshStandardMaterial({ map: uranusTexture, roughness: 0.8 });
    uranus = new THREE.Mesh(sphereGeometry, uranusMat);
    uranus.scale.setScalar(1.2);
    uranus.position.copy(PLANET_POSITIONS.uranus);
    scene.add(uranus);
    
    // 9. NEPTUNE
    const neptTexture = generateProceduralTexture('bands', '#2b4d8a', '#102553');
    const neptMat = new THREE.MeshStandardMaterial({ map: neptTexture, roughness: 0.8 });
    neptune = new THREE.Mesh(sphereGeometry, neptMat);
    neptune.scale.setScalar(1.15);
    neptune.position.copy(PLANET_POSITIONS.neptune);
    scene.add(neptune);
}

/* ==========================================================================
   SCROLL ENGINE & CAMERA INTERPOLATION
   ========================================================================== */

function updateCameraPath(progress) {
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
    document.getElementById('active-planet-name').textContent = SECTION_PLANETS[planetIdx];
}

function handleScroll() {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;
    
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollPercent = scrollTop / scrollHeight;
    
    // Calculate scroll speed (velocity) for Star Warp visual
    const scrollVelocity = Math.abs(scrollTop - lastScrollTop);
    lastScrollTop = scrollTop;
    
    // Target FOV expands during scroll velocity
    fovWarpTarget = 45 + Math.min(scrollVelocity * 0.18, 14);
    
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

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    // Drifts for background 3D parallax
    mouseX = (event.clientX - window.innerWidth / 2) / 100;
    mouseY = (event.clientY - window.innerHeight / 2) / 100;
    
    // Track cursor coordinates for custom follower
    cursorX = event.clientX;
    cursorY = event.clientY;
    
    // Position small dot instantly
    const dot = document.getElementById('custom-cursor-dot');
    const cursor = document.getElementById('custom-cursor');
    if (dot && cursor) {
        dot.style.left = cursorX + 'px';
        dot.style.top = cursorY + 'px';
        dot.style.opacity = '1';
        cursor.style.opacity = '1';
    }
}

/* ==========================================================================
   ANIMATION & RENDER LOOP
   ========================================================================== */

function animate() {
    requestAnimationFrame(animate);
    
    // 1. Smooth Camera Flight (Lerp)
    currentCameraPos.lerp(targetCameraPos, 0.035);
    currentCameraTarget.lerp(targetCameraTarget, 0.035);
    
    camera.position.copy(currentCameraPos);
    
    // Apply mouse parallax drift
    camera.position.x += (mouseX - camera.position.x * 0.005) * 0.1;
    camera.position.y += (-mouseY - camera.position.y * 0.005) * 0.1;
    
    camera.lookAt(currentCameraTarget);
    
    // 2. Camera FOV Warp Speed decay effect on scroll
    camera.fov += (fovWarpTarget - camera.fov) * 0.08;
    fovWarpTarget += (45 - fovWarpTarget) * 0.06; // decay back to 45
    camera.updateProjectionMatrix();
    
    // 3. Planet self rotations
    const time = Date.now() * 0.0003;
    
    if (sun) sun.rotation.y = time * 0.2;
    if (mercury) mercury.rotation.y = time * 0.4;
    if (venus) venus.rotation.y = -time * 0.35;
    
    if (earth) {
        earth.rotation.y = time * 0.8;
        if (clouds) clouds.rotation.y = time * 0.95;
        
        if (moon) {
            const moonOrbitRadius = 3.2;
            const moonSpeed = time * 1.5;
            moon.position.set(
                PLANET_POSITIONS.earth.x + Math.cos(moonSpeed) * moonOrbitRadius,
                0,
                PLANET_POSITIONS.earth.z + Math.sin(moonSpeed) * moonOrbitRadius
            );
            moon.rotation.y = moonSpeed;
        }
    }
    
    if (mars) mars.rotation.y = time * 0.75;
    if (jupiter) jupiter.rotation.y = time * 1.8;
    if (saturn) {
        saturn.rotation.y = time * 1.5;
        if (saturnRings) saturnRings.rotation.z = -time * 0.1;
    }
    if (uranus) {
        uranus.rotation.y = -time * 1.25;
        uranus.rotation.z = Math.PI * 0.5;
    }
    if (neptune) neptune.rotation.y = time * 1.35;
    
    // 4. Belt & Starfield drift
    if (asteroids) {
        asteroids.rotation.y = time * 0.06;
    }
    if (stars) {
        stars.rotation.y = time * 0.01;
        // Stretch stars slightly along velocity axis during fast scrolling
        const warpForce = Math.abs(camera.fov - 45) * 0.05;
        stars.scale.set(1, 1, 1 + warpForce);
    }
    
    renderer.render(scene, camera);
}

/* ==========================================================================
   UI INTERACTIVE WORKERS (TYPING, CURSOR, TILT)
   ========================================================================== */

// Typing Banner logic
const TYPING_ROLES = [
    "a Software Engineer.",
    "a Full-Stack Developer.",
    "a Cloud & DevOps Specialist.",
    "scalable web architectures."
];
let roleIdx = 0;
let charIdx = 0;
let isDeleting = false;

function typeEffect() {
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
        typeSpeed = 1800; // hold words at full typing
        isDeleting = true;
    } else if (isDeleting && charIdx === 0) {
        isDeleting = false;
        roleIdx = (roleIdx + 1) % TYPING_ROLES.length;
        typeSpeed = 400; // wait before next word
    }
    
    setTimeout(typeEffect, typeSpeed);
}

// Custom Cursor reticle follow loop (lerp)
function updateCursorFollower() {
    followerX += (cursorX - followerX) * 0.12;
    followerY += (cursorY - followerY) * 0.12;
    
    const cursor = document.getElementById('custom-cursor');
    if (cursor) {
        cursor.style.left = followerX + 'px';
        cursor.style.top = followerY + 'px';
    }
    requestAnimationFrame(updateCursorFollower);
}

// 3D Card Hover Tilts
function setupCardTilts() {
    const cards = document.querySelectorAll('.panel-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Calculate tilt angle (-12deg to 12deg)
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

// Global active tab selector
function switchSkillsTab(tabId) {
    const tabContents = document.querySelectorAll('.skills-tab-content');
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabContents.forEach(content => content.classList.remove('active'));
    tabBtns.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`tab-${tabId}`).classList.add('active');
    
    tabBtns.forEach(btn => {
        if (btn.getAttribute('onclick').includes(tabId)) {
            btn.classList.add('active');
        }
    });
}

// Intercept window scroll events
window.addEventListener('scroll', handleScroll);

// DOM Startup
document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.querySelector('.nav-mobile-btn');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-links a');
    
    // Mobile navigation toggle
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('mobile-active');
            menuBtn.querySelector('i').classList.toggle('fa-bars');
            menuBtn.querySelector('i').classList.toggle('fa-xmark');
        });
    }
    
    // Smooth scrolling links
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (navLinks) navLinks.classList.remove('mobile-active');
            if (menuBtn) {
                menuBtn.querySelector('i').classList.add('fa-bars');
                menuBtn.querySelector('i').classList.remove('fa-xmark');
            }
            
            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Setup hover element classes for Custom Cursor
    document.addEventListener('mouseover', (e) => {
        const hoverSelector = 'a, button, .tab-btn, .project-box, .skill-pill, .cert-card, .submit-btn, .nav-mobile-btn, .contact-form input, .contact-form textarea';
        const isHovered = e.target.closest(hoverSelector);
        
        const cursor = document.getElementById('custom-cursor');
        const dot = document.getElementById('custom-cursor-dot');
        
        if (cursor && dot) {
            if (isHovered) {
                cursor.classList.add('cursor-hover');
                dot.classList.add('cursor-hover-dot');
            } else {
                cursor.classList.remove('cursor-hover');
                dot.classList.remove('cursor-hover-dot');
            }
        }
    });
    
    // Card Entrance Transitions
    const slides = document.querySelectorAll('.sec-slide');
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.18
    };
    
    const slideObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active-sec');
            } else {
                entry.target.classList.remove('active-sec');
            }
        });
    }, observerOptions);
    
    slides.forEach(slide => {
        slideObserver.observe(slide);
    });
    
    // Init Visual loops
    initThree();
    animate();
    handleScroll();
    typeEffect();
    updateCursorFollower();
    setupCardTilts();
});
