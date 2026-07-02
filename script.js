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

// Keyframes matching scroll sections (Progress indices 0 to 7)
// Each keyframe defines camera position and lookAt target point
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.15); // soft fill
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

// Helper to generate dynamic Canvas2D textures
function generateProceduralTexture(type, colorBase, colorDetail) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    if (type === 'sun') {
        // Radial fiery solar flares texture
        const grad = ctx.createLinearGradient(0, 0, 512, 0);
        grad.addColorStop(0, '#ffcc00');
        grad.addColorStop(0.3, '#ff6600');
        grad.addColorStop(0.6, '#ff3300');
        grad.addColorStop(1, '#ffcc00');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 256);
        
        // Solar activity detail
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        for (let i = 0; i < 40; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * 512, Math.random() * 256, Math.random() * 40 + 10, 0, Math.PI * 2);
            ctx.fill();
        }
    } 
    else if (type === 'bands') {
        // Jupiter / Saturn gas giant bands
        ctx.fillStyle = colorBase;
        ctx.fillRect(0, 0, 512, 256);
        
        // Dynamic horizontal banding
        for (let y = 0; y < 256; y += Math.random() * 15 + 5) {
            ctx.fillStyle = Math.random() > 0.5 ? colorDetail : 'rgba(255,255,255,0.08)';
            ctx.fillRect(0, y, 512, Math.random() * 10 + 2);
        }
        // Add swirling storms (Jupiter Great Red Spot, Neptune cloud spots)
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
        // Rocky planets (Mercury, Moon, Mars)
        ctx.fillStyle = colorBase;
        ctx.fillRect(0, 0, 512, 256);
        
        // Noise pattern
        ctx.fillStyle = colorDetail;
        for (let i = 0; i < 3000; i++) {
            ctx.fillRect(Math.random() * 512, Math.random() * 256, Math.random() * 2 + 1, Math.random() * 2 + 1);
        }
        
        // Cratering rings
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
        // Earth oceans + continents
        ctx.fillStyle = '#0d2b45'; // Oceans
        ctx.fillRect(0, 0, 512, 256);
        
        // Continent shapes using blobby drawings
        ctx.fillStyle = '#203c20'; // Green continents
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
        
        // Polar ice caps
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 512, 25);
        ctx.fillRect(0, 235, 512, 21);
    }
    else if (type === 'clouds') {
        // Translucent clouds layer for Earth
        ctx.clearRect(0, 0, 512, 256);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        // Draw cloud bands and swirls
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

// Generate Saturn's Ring 1D Concentric texture
function generateSaturnRingTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    
    // Draw concentric gradients simulating ring bands
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, 'rgba(168, 142, 107, 0.0)'); // Inner space
    grad.addColorStop(0.2, 'rgba(195, 175, 145, 0.9)'); // B ring
    grad.addColorStop(0.5, 'rgba(120, 110, 95, 0.1)');  // Cassini division
    grad.addColorStop(0.65, 'rgba(180, 160, 130, 0.85)'); // A ring
    grad.addColorStop(0.85, 'rgba(150, 130, 100, 0.5)');  // Encke division
    grad.addColorStop(1.0, 'rgba(168, 142, 107, 0.0)'); // Outer space
    
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
        // Position scattered widely
        positions[i * 3] = (Math.random() - 0.5) * 800;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 800;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 800;
        
        // Star colors (some white, cyan, blue, magenta)
        const rand = Math.random();
        if (rand > 0.8) {
            colors[i * 3] = 0.0;     // Cyan glow stars
            colors[i * 3 + 1] = 0.95;
            colors[i * 3 + 2] = 1.0;
        } else if (rand > 0.65) {
            colors[i * 3] = 0.5;     // Purple/Magenta stars
            colors[i * 3 + 1] = 0.0;
            colors[i * 3 + 2] = 0.9;
        } else {
            colors[i * 3] = 1.0;     // Pure white stars
            colors[i * 3 + 1] = 1.0;
            colors[i * 3 + 2] = 1.0;
        }
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Small glowing square particles
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
        // Orbit radii between Mars (-85) and Jupiter (-135), let's place it at -110 Z center
        const radius = 10 + Math.random() * 18;
        const angle = Math.random() * Math.PI * 2;
        
        // Orbit positions scattered around the center of gravity
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
        // Calculate orbit center and circle radius relative to Z position
        // All planets orbit in circles centering around the central Z-axis of the Sun
        const radius = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
        
        const segments = 128;
        const geometry = new THREE.BufferGeometry();
        const points = [];
        
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            // Draw horizontal circle centered on Z axis projection
            // Shift circle to center around (0, 0, Z_midpoint) to align with elliptical depth
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
    earth.add(clouds); // Add as child so it moves and positions relative to Earth
    
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
    
    // Remap UV coordinates of flat ring geometry to concentric circles mapped outwards
    const posAttribute = ringGeo.attributes.position;
    const uvAttribute = ringGeo.attributes.uv;
    for (let i = 0; i < posAttribute.count; i++) {
        const x = posAttribute.getX(i);
        const y = posAttribute.getY(i);
        const distance = Math.sqrt(x*x + y*y);
        
        // Normalize UV map: 1.4 inner boundary translates to 0, 2.5 outer translates to 1
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
    saturnRings.rotation.x = Math.PI * 0.45; // Tilt the rings
    saturnRings.rotation.y = Math.PI * 0.1;
    saturn.add(saturnRings); // Attach to Saturn
    
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

// Update target camera coordinates based on current scroll position
function updateCameraPath(progress) {
    // Safety boundaries
    const maxVal = KEYFRAMES.length - 1;
    const progressClamped = Math.max(0, Math.min(progress, maxVal));
    
    // Segment indices
    const i = Math.floor(progressClamped);
    const f = progressClamped - i;
    
    if (i >= maxVal) {
        targetCameraPos.copy(KEYFRAMES[maxVal].pos);
        targetCameraTarget.copy(KEYFRAMES[maxVal].lookAt);
    } else {
        // Interpolate camera position and focus lookAt between keyframes
        targetCameraPos.lerpVectors(KEYFRAMES[i].pos, KEYFRAMES[i + 1].pos, f);
        targetCameraTarget.lerpVectors(KEYFRAMES[i].lookAt, KEYFRAMES[i + 1].lookAt, f);
    }
    
    // Update visual subtitle indicator
    const planetIdx = Math.min(Math.floor(progressClamped + 0.35), SECTION_PLANETS.length - 1);
    document.getElementById('active-planet-name').textContent = SECTION_PLANETS[planetIdx];
}

// Track page scroll percentage
function handleScroll() {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;
    
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollPercent = scrollTop / scrollHeight;
    
    // Map scroll percentage (0 to 1) linearly to Keyframes (0 to KEYFRAMES.length - 1)
    const progress = scrollPercent * (KEYFRAMES.length - 1);
    updateCameraPath(progress);
    
    // Highlight Navbar Active State
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

// Window resizing handler
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Subtle 3D parallax drift based on mouse positions
function onMouseMove(event) {
    mouseX = (event.clientX - window.innerWidth / 2) / 100;
    mouseY = (event.clientY - window.innerHeight / 2) / 100;
}

/* ==========================================================================
   ANIMATION & RENDER LOOP
   ========================================================================== */

function animate() {
    requestAnimationFrame(animate);
    
    // 1. Smooth Camera Flight (Lerp with inertia)
    currentCameraPos.lerp(targetCameraPos, 0.035);
    currentCameraTarget.lerp(targetCameraTarget, 0.035);
    
    camera.position.copy(currentCameraPos);
    
    // Apply subtle mouse parallax drifting to camera position
    camera.position.x += (mouseX - camera.position.x * 0.005) * 0.1;
    camera.position.y += (-mouseY - camera.position.y * 0.005) * 0.1;
    
    camera.lookAt(currentCameraTarget);
    
    // 2. Celestial Object Rotations (Spinning planets on axes)
    const time = Date.now() * 0.0003;
    
    if (sun) sun.rotation.y = time * 0.2;
    if (mercury) mercury.rotation.y = time * 0.4;
    if (venus) venus.rotation.y = -time * 0.35; // Venus spins backwards
    
    if (earth) {
        earth.rotation.y = time * 0.8;
        if (clouds) clouds.rotation.y = time * 0.95; // clouds orbit slightly faster
        
        // Animate Moon Orbit around Earth
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
    if (jupiter) jupiter.rotation.y = time * 1.8; // Jupiter rotates incredibly fast
    if (saturn) {
        saturn.rotation.y = time * 1.5;
        // saturnRings are attached, automatically orbit with Saturn, but let's counter-rotate rings slightly
        if (saturnRings) saturnRings.rotation.z = -time * 0.1;
    }
    if (uranus) {
        uranus.rotation.y = -time * 1.25;
        uranus.rotation.z = Math.PI * 0.5; // Uranus tilts on its side
    }
    if (neptune) neptune.rotation.y = time * 1.35;
    
    // 3. Asteroid belt orbiting Sun
    if (asteroids) {
        asteroids.rotation.y = time * 0.06;
    }
    
    // 4. Distant star twinkling rotation
    if (stars) {
        stars.rotation.y = time * 0.01;
    }
    
    renderer.render(scene, camera);
}

/* ==========================================================================
   UI / NAVIGATION ACTIONS
   ========================================================================== */

// Skills Tab Switcher
function switchSkillsTab(tabId) {
    const tabContents = document.querySelectorAll('.skills-tab-content');
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabContents.forEach(content => content.classList.remove('active'));
    tabBtns.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`tab-${tabId}`).classList.add('active');
    
    // Find matching button based on onclick string
    tabBtns.forEach(btn => {
        if (btn.getAttribute('onclick').includes(tabId)) {
            btn.classList.add('active');
        }
    });
}

// Intercept window scroll events
window.addEventListener('scroll', handleScroll);

// Setup Mobile Navigation Menu Trigger
document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.querySelector('.nav-mobile-btn');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-links a');
    
    menuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('mobile-active');
        menuBtn.querySelector('i').classList.toggle('fa-bars');
        menuBtn.querySelector('i').classList.toggle('fa-xmark');
    });
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.classList.remove('mobile-active');
            menuBtn.querySelector('i').classList.add('fa-bars');
            menuBtn.querySelector('i').classList.remove('fa-xmark');
            
            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Initial load animations: scroll-slides transition
    const slides = document.querySelectorAll('.sec-slide');
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.18 // Trigger visible class when 18% of slide is shown
    };
    
    const slideObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active-sec');
            } else {
                // Keep the active class on active slide to prevent visual blinking, or let it fade out
                entry.target.classList.remove('active-sec');
            }
        });
    }, observerOptions);
    
    slides.forEach(slide => {
        slideObserver.observe(slide);
    });
    
    // Run Three.js
    initThree();
    animate();
    handleScroll(); // Trigger initial position checks
});
