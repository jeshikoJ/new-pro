/* ==========================================================================
   THREE.JS SPACE & BACKGROUND SYSTEM (ULTRA REALISM & SHADOWS)
   ========================================================================== */

// Global scene components
let scene, camera, renderer;
let sun, mercury, venus, earth, clouds, moon, mars, jupiter, saturn, saturnRings, uranus, neptune;
let uranusRings, neptuneRings; // Additional ring systems
let sunRays1, sunRays2; // Volumetric sunburst planes
let orbitLines = [];
let starLayers = [];
let asteroids;
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

// Planet axial tilts in radians
const AXIAL_TILTS = {
    mercury: 0.0005,
    venus: 3.094,
    earth: 0.408,
    mars: 0.440,
    jupiter: 0.055,
    saturn: 0.466,
    uranus: 1.706,
    neptune: 0.494
};

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
    scene.fog = new THREE.FogExp2(0x020206, 0.0015);
    
    // Camera setup
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.copy(currentCameraPos);
    
    // Renderer setup with shadow maps enabled
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    
    // Enable realistic shadow casting
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.07);
    scene.add(ambientLight);
    
    // Sun light (Point light casting shadows in all directions)
    const sunLight = new THREE.PointLight(0xfff5e6, 2.5, 550, 0.45);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 380;
    sunLight.shadow.bias = -0.002; // Prevents shadow acne artifacts
    scene.add(sunLight);
    
    // Distant cosmic ambient lighting
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
   PROCEDURAL TEXTURE, SPECULAR, AND BUMP GENERATORS
   ========================================================================== */

function generateProceduralTexture(type, colorBase, colorDetail) {
    const size = type === 'sunray' ? 512 : 1024; // High res textures
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = type === 'sunray' ? size : size / 2;
    const ctx = canvas.getContext('2d');
    
    if (type === 'sun') {
        const grad = ctx.createLinearGradient(0, 0, size, 0);
        grad.addColorStop(0, '#ffdd33');
        grad.addColorStop(0.2, '#ff8800');
        grad.addColorStop(0.5, '#ff3300');
        grad.addColorStop(0.8, '#ff8800');
        grad.addColorStop(1, '#ffdd33');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size/2);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
        for (let i = 0; i < 60; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * size, Math.random() * (size/2), Math.random() * 80 + 20, 0, Math.PI * 2);
            ctx.fill();
        }
    } 
    else if (type === 'sunray') {
        // Volumetric flares gradient
        ctx.clearRect(0, 0, size, size);
        const grad = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
        grad.addColorStop(0, 'rgba(255, 210, 100, 0.9)');
        grad.addColorStop(0.25, 'rgba(255, 120, 0, 0.35)');
        grad.addColorStop(0.6, 'rgba(255, 45, 0, 0.08)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(256, 256, 256, 0, Math.PI * 2); ctx.fill();
        
        // Draw flare spokes
        ctx.strokeStyle = 'rgba(255, 180, 50, 0.1)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 45; i++) {
            const angle = Math.random() * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(256, 256);
            ctx.lineTo(256 + Math.cos(angle)*256, 256 + Math.sin(angle)*256);
            ctx.stroke();
        }
    }
    else if (type === 'clouds') {
        ctx.clearRect(0, 0, size, size/2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        for (let i = 0; i < 60; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * size, Math.random() * (size/2 - 100) + 50, Math.random() * 60 + 15, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    if (type !== 'sunray') {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
    }
    return texture;
}

// Generate Planet textures (diffuse + bump maps)
function generatePlanetTextures(type, colorBase, colorDetail) {
    const size = 1024;
    const canvas = document.createElement('canvas');
    const bCanvas = document.createElement('canvas'); // Bump map
    
    canvas.width = bCanvas.width = size;
    canvas.height = bCanvas.height = size / 2;
    
    const ctx = canvas.getContext('2d');
    const bCtx = bCanvas.getContext('2d');
    
    if (type === 'bands') {
        ctx.fillStyle = colorBase;
        ctx.fillRect(0, 0, size, size/2);
        bCtx.fillStyle = '#7f7f7f';
        bCtx.fillRect(0, 0, size, size/2);
        
        for (let y = 0; y < size/2; y += Math.random() * 15 + 5) {
            ctx.fillStyle = Math.random() > 0.5 ? colorDetail : 'rgba(255,255,255,0.06)';
            ctx.fillRect(0, y, size, Math.random() * 8 + 1);
            
            bCtx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
            bCtx.fillRect(0, y, size, Math.random() * 8 + 1);
        }
        
        if (colorDetail === '#d14905') { // Jupiter Red Spot & storms
            ctx.fillStyle = '#b32b00';
            ctx.beginPath(); ctx.ellipse(640, 320, 50, 28, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 3; ctx.stroke();
            
            bCtx.fillStyle = '#9f9f9f';
            bCtx.beginPath(); bCtx.ellipse(640, 320, 50, 28, 0, 0, Math.PI * 2); bCtx.fill();
        }
    } 
    else if (type === 'cratered') {
        ctx.fillStyle = colorBase;
        ctx.fillRect(0, 0, size, size/2);
        
        bCtx.fillStyle = '#7f7f7f';
        bCtx.fillRect(0, 0, size, size/2);
        
        const img = ctx.getImageData(0, 0, size, size/2);
        const bImg = bCtx.getImageData(0, 0, size, size/2);
        const data = img.data;
        const bData = bImg.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 16;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));
            data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise));
            data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise));
            
            bData[i] = Math.max(0, Math.min(255, bData[i] + noise * 1.5));
            bData[i+1] = Math.max(0, Math.min(255, bData[i+1] + noise * 1.5));
            bData[i+2] = Math.max(0, Math.min(255, bData[i+2] + noise * 1.5));
        }
        ctx.putImageData(img, 0, 0);
        bCtx.putImageData(bImg, 0, 0);
        
        // Draw Craters
        for (let i = 0; i < 55; i++) {
            const rx = Math.random() * size;
            const ry = Math.random() * (size / 2);
            const r = Math.random() * 20 + 3;
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
            ctx.beginPath(); ctx.arc(rx, ry, r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
            
            bCtx.fillStyle = '#5c5c5c';
            bCtx.beginPath(); bCtx.arc(rx, ry, r, 0, Math.PI*2); bCtx.fill();
            
            bCtx.strokeStyle = '#ffffff';
            bCtx.lineWidth = 1;
            bCtx.beginPath(); bCtx.arc(rx, ry, r, 0, Math.PI*2); bCtx.stroke();
        }
    }
    
    return {
        map: new THREE.CanvasTexture(canvas),
        bumpMap: new THREE.CanvasTexture(bCanvas)
    };
}

// Generate Realistic Earth textures
function generateEarthTextures() {
    const size = 1024;
    const dCanvas = document.createElement('canvas'); // Diffuse
    const sCanvas = document.createElement('canvas'); // Specular
    const bCanvas = document.createElement('canvas'); // Bump
    
    dCanvas.width = sCanvas.width = bCanvas.width = size;
    dCanvas.height = sCanvas.height = bCanvas.height = size / 2;
    
    const dCtx = dCanvas.getContext('2d');
    const sCtx = sCanvas.getContext('2d');
    const bCtx = bCanvas.getContext('2d');
    
    // Oceans
    dCtx.fillStyle = '#0a213a'; dCtx.fillRect(0, 0, size, size/2);
    sCtx.fillStyle = '#ffffff'; sCtx.fillRect(0, 0, size, size/2);
    bCtx.fillStyle = '#7f7f7f'; bCtx.fillRect(0, 0, size, size/2);
    
    // Continents
    const drawContinent = (x, y, r) => {
        dCtx.fillStyle = '#223c1d';
        dCtx.beginPath(); dCtx.arc(x, y, r, 0, Math.PI*2); dCtx.fill();
        dCtx.fillStyle = '#4b3e2b';
        dCtx.beginPath(); dCtx.arc(x + r*0.2, y - r*0.1, r*0.5, 0, Math.PI*2); dCtx.fill();
        
        sCtx.fillStyle = '#000000';
        sCtx.beginPath(); sCtx.arc(x, y, r, 0, Math.PI*2); sCtx.fill();
        
        bCtx.fillStyle = '#b5b5b5';
        bCtx.beginPath(); bCtx.arc(x, y, r, 0, Math.PI*2); bCtx.fill();
    };
    
    drawContinent(200, 220, 96);
    drawContinent(280, 260, 76);
    drawContinent(360, 220, 116);
    drawContinent(240, 360, 56);
    drawContinent(720, 200, 88);
    drawContinent(760, 340, 76);
    drawContinent(680, 160, 64);
    drawContinent(520, 360, 44);
    
    // Polar Ice Caps
    dCtx.fillStyle = '#ffffff'; dCtx.fillRect(0, 0, size, 44); dCtx.fillRect(0, size/2 - 40, size, 40);
    sCtx.fillStyle = '#3a3a3a'; sCtx.fillRect(0, 0, size, 44); sCtx.fillRect(0, size/2 - 40, size, 40);
    bCtx.fillStyle = '#c8c8c8'; bCtx.fillRect(0, 0, size, 44); bCtx.fillRect(0, size/2 - 40, size, 40);
    
    // Add bump map noise
    const bImg = bCtx.getImageData(0, 0, size, size/2);
    const bData = bImg.data;
    for (let i = 0; i < bData.length; i += 4) {
        if (bData[i] > 127) {
            const noise = (Math.random() - 0.5) * 35;
            bData[i] = Math.max(0, Math.min(255, bData[i] + noise));
            bData[i+1] = Math.max(0, Math.min(255, bData[i+1] + noise));
            bData[i+2] = Math.max(0, Math.min(255, bData[i+2] + noise));
        }
    }
    bCtx.putImageData(bImg, 0, 0);
    
    return {
        map: new THREE.CanvasTexture(dCanvas),
        specularMap: new THREE.CanvasTexture(sCanvas),
        bumpMap: new THREE.CanvasTexture(bCanvas)
    };
}

function generateSaturnRingTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, 'rgba(168, 142, 107, 0.0)');
    grad.addColorStop(0.2, 'rgba(195, 175, 145, 0.9)');
    grad.addColorStop(0.5, 'rgba(120, 110, 95, 0.1)'); // Cassini Division
    grad.addColorStop(0.65, 'rgba(180, 160, 130, 0.85)');
    grad.addColorStop(0.85, 'rgba(150, 130, 100, 0.5)'); // Encke Division
    grad.addColorStop(1.0, 'rgba(168, 142, 107, 0.0)');
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 16);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

/* ==========================================================================
   COSMIC ENTITY CREATION (MULTI-LAYER STARS & INSTANCED ASTEROIDS)
   ========================================================================== */

function createStarfield() {
    createStarLayer(4000, 0.45, 0.4, 900);
    createStarLayer(1500, 0.80, 0.7, 600);
    createStarLayer(400,  1.35, 0.9, 300);
}

function createStarLayer(count, size, opacity, radiusRange) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
        const r = (Math.random() * 0.5 + 0.5) * radiusRange;
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
        
        const rand = Math.random();
        if (rand > 0.85) {
            colors[i * 3] = 0.0;     // Cyan
            colors[i * 3 + 1] = 0.9;
            colors[i * 3 + 2] = 1.0;
        } else if (rand > 0.7) {
            colors[i * 3] = 0.6;     // Purple
            colors[i * 3 + 1] = 0.1;
            colors[i * 3 + 2] = 0.9;
        } else {
            colors[i * 3] = 1.0;     // White
            colors[i * 3 + 1] = 1.0;
            colors[i * 3 + 2] = 1.0;
        }
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
        size: size,
        vertexColors: true,
        transparent: true,
        opacity: opacity,
        sizeAttenuation: true
    });
    
    const layer = new THREE.Points(geometry, material);
    scene.add(layer);
    starLayers.push(layer);
}

// Instanced 3D Asteroid Belt (High Performance Realism)
function createAsteroidBelt() {
    const count = 350; // 350 actual 3D rocks casting and receiving shadows
    const rockGeo = new THREE.DodecahedronGeometry(0.12, 1);
    
    const rockMat = new THREE.MeshStandardMaterial({
        color: 0x5a544f,
        roughness: 0.95,
        metalness: 0.05
    });
    
    asteroids = new THREE.InstancedMesh(rockGeo, rockMat, count);
    asteroids.castShadow = true;
    asteroids.receiveShadow = true;
    
    const dummy = new THREE.Object3D();
    
    for (let i = 0; i < count; i++) {
        const radius = 12 + Math.random() * 16;
        const angle = Math.random() * Math.PI * 2;
        
        const x = Math.cos(angle) * radius;
        const y = (Math.random() - 0.5) * 1.8;
        const z = -110 + Math.sin(angle) * radius;
        
        dummy.position.set(x, y, z);
        
        dummy.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        
        const scale = Math.random() * 0.8 + 0.4;
        dummy.scale.set(scale, scale, scale);
        
        dummy.updateMatrix();
        asteroids.setMatrixAt(i, dummy.matrix);
    }
    
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
    // Smoother 64-segment spheres for planets
    const sphereGeometry = new THREE.SphereGeometry(1, 64, 64);
    
    // 1. SUN
    const sunTexture = generateProceduralTexture('sun');
    const sunMat = new THREE.MeshBasicMaterial({ map: sunTexture });
    sun = new THREE.Mesh(new THREE.SphereGeometry(4.5, 64, 64), sunMat);
    sun.position.copy(PLANET_POSITIONS.sun);
    scene.add(sun);
    
    // Atmospheric Glow
    const sunGlowGeo = new THREE.SphereGeometry(5.2, 64, 64);
    const sunGlowMat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    });
    const sunGlow = new THREE.Mesh(sunGlowGeo, sunGlowMat);
    sun.add(sunGlow);
    
    // Intersecting Sun Flare Planes (Lens Flare shimmers)
    const rayGeo = new THREE.PlaneGeometry(16, 16);
    const rayTexture = generateProceduralTexture('sunray');
    const rayMat = new THREE.MeshBasicMaterial({
        map: rayTexture,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    sunRays1 = new THREE.Mesh(rayGeo, rayMat);
    sunRays2 = new THREE.Mesh(rayGeo, rayMat);
    sunRays2.rotation.z = Math.PI / 4;
    sun.add(sunRays1);
    sun.add(sunRays2);
    
    // 2. MERCURY
    const mercMaps = generatePlanetTextures('cratered', '#6e6e76', '#323236');
    const mercMat = new THREE.MeshPhongMaterial({ 
        map: mercMaps.map, 
        bumpMap: mercMaps.bumpMap,
        bumpScale: 0.03,
        shininess: 3 
    });
    mercury = new THREE.Mesh(sphereGeometry, mercMat);
    mercury.scale.setScalar(0.4);
    mercury.castShadow = true;
    mercury.receiveShadow = true;
    
    const mercuryPivot = new THREE.Group();
    mercuryPivot.position.copy(PLANET_POSITIONS.mercury);
    mercuryPivot.rotation.z = AXIAL_TILTS.mercury;
    mercuryPivot.add(mercury);
    scene.add(mercuryPivot);
    
    // 3. VENUS
    const venMaps = generatePlanetTextures('bands', '#e3a857', '#935817');
    const venMat = new THREE.MeshPhongMaterial({ 
        map: venMaps.map, 
        bumpMap: venMaps.bumpMap,
        bumpScale: 0.015,
        shininess: 5 
    });
    venus = new THREE.Mesh(sphereGeometry, venMat);
    venus.scale.setScalar(0.9);
    venus.castShadow = true;
    venus.receiveShadow = true;
    
    const venusPivot = new THREE.Group();
    venusPivot.position.copy(PLANET_POSITIONS.venus);
    venusPivot.rotation.z = AXIAL_TILTS.venus;
    venusPivot.add(venus);
    scene.add(venusPivot);
    
    // 4. EARTH & MOON
    const earthMaps = generateEarthTextures();
    const earthMat = new THREE.MeshPhongMaterial({ 
        map: earthMaps.map, 
        bumpMap: earthMaps.bumpMap,
        bumpScale: 0.04,
        specularMap: earthMaps.specularMap,
        specular: new THREE.Color(0x777777),
        shininess: 20 
    });
    earth = new THREE.Mesh(sphereGeometry, earthMat);
    earth.scale.setScalar(1.0);
    earth.castShadow = true;
    earth.receiveShadow = true;
    
    // Atmosphere glow
    const earthGlowGeo = new THREE.SphereGeometry(1.12, 64, 64);
    const earthGlowMat = new THREE.MeshBasicMaterial({
        color: 0x00f2fe,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    });
    const earthGlow = new THREE.Mesh(earthGlowGeo, earthGlowMat);
    earth.add(earthGlow);
    
    // Clouds
    const cloudTexture = generateProceduralTexture('clouds');
    const cloudMat = new THREE.MeshStandardMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: 0.42
    });
    clouds = new THREE.Mesh(new THREE.SphereGeometry(1.025, 64, 64), cloudMat);
    clouds.castShadow = true; // Clouds cast shadows onto Earth!
    clouds.receiveShadow = true;
    earth.add(clouds);
    
    const earthPivot = new THREE.Group();
    earthPivot.position.copy(PLANET_POSITIONS.earth);
    earthPivot.rotation.z = AXIAL_TILTS.earth;
    earthPivot.add(earth);
    scene.add(earthPivot);
    
    // Moon
    const moonTexture = generateProceduralTexture('cratered', '#909090', '#3b3b3b');
    const moonMat = new THREE.MeshPhongMaterial({ map: moonTexture, shininess: 2 });
    moon = new THREE.Mesh(sphereGeometry, moonMat);
    moon.scale.setScalar(0.24);
    moon.castShadow = true;
    moon.receiveShadow = true;
    scene.add(moon);
    
    // 5. MARS
    const marsMaps = generatePlanetTextures('cratered', '#c7501a', '#611603');
    const marsMat = new THREE.MeshPhongMaterial({ 
        map: marsMaps.map, 
        bumpMap: marsMaps.bumpMap,
        bumpScale: 0.035,
        shininess: 4 
    });
    mars = new THREE.Mesh(sphereGeometry, marsMat);
    mars.scale.setScalar(0.7);
    mars.castShadow = true;
    mars.receiveShadow = true;
    
    const marsPivot = new THREE.Group();
    marsPivot.position.copy(PLANET_POSITIONS.mars);
    marsPivot.rotation.z = AXIAL_TILTS.mars;
    marsPivot.add(mars);
    scene.add(marsPivot);
    
    // 6. JUPITER
    const jupMaps = generatePlanetTextures('bands', '#dbcfa8', '#d14905');
    const jupMat = new THREE.MeshPhongMaterial({ 
        map: jupMaps.map, 
        bumpMap: jupMaps.bumpMap,
        bumpScale: 0.01,
        shininess: 8 
    });
    jupiter = new THREE.Mesh(sphereGeometry, jupMat);
    jupiter.scale.setScalar(2.2);
    jupiter.castShadow = true;
    jupiter.receiveShadow = true;
    
    const jupiterPivot = new THREE.Group();
    jupiterPivot.position.copy(PLANET_POSITIONS.jupiter);
    jupiterPivot.rotation.z = AXIAL_TILTS.jupiter;
    jupiterPivot.add(jupiter);
    scene.add(jupiterPivot);
    
    // 7. SATURN & RINGS
    const satMaps = generatePlanetTextures('bands', '#e6c88f', '#b08f51');
    const satMat = new THREE.MeshPhongMaterial({ 
        map: satMaps.map, 
        bumpMap: satMaps.bumpMap,
        bumpScale: 0.01,
        shininess: 6 
    });
    saturn = new THREE.Mesh(sphereGeometry, satMat);
    saturn.scale.setScalar(1.85);
    saturn.castShadow = true;
    saturn.receiveShadow = true;
    
    // Saturn Rings
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
        opacity: 0.85,
        roughness: 0.4
    });
    saturnRings = new THREE.Mesh(ringGeo, ringMat);
    saturnRings.rotation.x = Math.PI * 0.45;
    saturnRings.rotation.y = Math.PI * 0.1;
    saturnRings.castShadow = true;
    saturnRings.receiveShadow = true;
    saturn.add(saturnRings);
    
    const saturnPivot = new THREE.Group();
    saturnPivot.position.copy(PLANET_POSITIONS.saturn);
    saturnPivot.rotation.z = AXIAL_TILTS.saturn;
    saturnPivot.add(saturn);
    scene.add(saturnPivot);
    
    // 8. URANUS & faint vertical rings
    const uranusTexture = generateProceduralTexture('bands', '#b0e7eb', '#67adb5');
    const uranusMat = new THREE.MeshPhongMaterial({ map: uranusTexture, shininess: 5 });
    uranus = new THREE.Mesh(sphereGeometry, uranusMat);
    uranus.scale.setScalar(1.2);
    uranus.castShadow = true;
    uranus.receiveShadow = true;
    
    // Uranus Ring (very thin vertical ring system)
    const uranusRingGeo = new THREE.RingGeometry(1.4, 1.6, 64);
    const uranusRingMat = new THREE.MeshBasicMaterial({
        color: 0xa8e1e6,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.25
    });
    uranusRings = new THREE.Mesh(uranusRingGeo, uranusRingMat);
    uranusRings.rotation.x = Math.PI * 0.5; // orthogonal
    uranusRings.rotation.y = Math.PI * 0.05;
    uranus.add(uranusRings);
    
    const uranusPivot = new THREE.Group();
    uranusPivot.position.copy(PLANET_POSITIONS.uranus);
    uranusPivot.rotation.z = AXIAL_TILTS.uranus;
    uranusPivot.add(uranus);
    scene.add(uranusPivot);
    
    // 9. NEPTUNE & faint rings
    const neptTexture = generateProceduralTexture('bands', '#305494', '#0d1d3f');
    const neptMat = new THREE.MeshPhongMaterial({ map: neptTexture, shininess: 5 });
    neptune = new THREE.Mesh(sphereGeometry, neptMat);
    neptune.scale.setScalar(1.15);
    neptune.castShadow = true;
    neptune.receiveShadow = true;
    
    // Neptune Ring
    const neptuneRingGeo = new THREE.RingGeometry(1.3, 1.45, 64);
    const neptuneRingMat = new THREE.MeshBasicMaterial({
        color: 0x305494,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.2
    });
    neptuneRings = new THREE.Mesh(neptuneRingGeo, neptuneRingMat);
    neptuneRings.rotation.x = Math.PI * 0.42;
    neptuneRings.rotation.y = Math.PI * 0.08;
    neptune.add(neptuneRings);
    
    const neptunePivot = new THREE.Group();
    neptunePivot.position.copy(PLANET_POSITIONS.neptune);
    neptunePivot.rotation.z = AXIAL_TILTS.neptune;
    neptunePivot.add(neptune);
    scene.add(neptunePivot);
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
    
    const scrollVelocity = Math.abs(scrollTop - lastScrollTop);
    lastScrollTop = scrollTop;
    
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
    
    // 2. Camera FOV Warp Speed decay
    camera.fov += (fovWarpTarget - camera.fov) * 0.08;
    fovWarpTarget += (45 - fovWarpTarget) * 0.06;
    camera.updateProjectionMatrix();
    
    const time = Date.now() * 0.0003;
    
    // 3. Volumetric Sun Flare shimmers (Counter-rotating planes)
    if (sunRays1) sunRays1.rotation.z = time * 0.07;
    if (sunRays2) sunRays2.rotation.z = -time * 0.04;
    
    // 4. Planet self rotations
    if (sun) sun.rotation.y = time * 0.2;
    if (mercury) mercury.rotation.y = time * 0.4;
    if (venus) venus.rotation.y = -time * 0.35;
    
    if (earth) {
        earth.rotation.y = time * 0.8;
        if (clouds) clouds.rotation.y = time * 0.92;
        
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
        if (uranusRings) uranusRings.rotation.z = -time * 0.1;
    }
    if (neptune) {
        neptune.rotation.y = time * 1.35;
        if (neptuneRings) neptuneRings.rotation.z = -time * 0.1;
    }
    
    // 5. Instanced 3D Belt & Starfield drift
    if (asteroids) {
        asteroids.rotation.y = time * 0.06;
    }
    
    // Star layers drift
    starLayers.forEach((layer, idx) => {
        layer.rotation.y = time * (0.006 * (idx + 1));
        layer.rotation.x = time * (0.002 * (idx + 1));
        
        const warpForce = Math.abs(camera.fov - 45) * 0.05;
        layer.scale.set(1, 1, 1 + warpForce);
    });
    
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
