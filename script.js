/* ==========================================================================
   THREE.JS SPACE & BACKGROUND SYSTEM (HIGH REALISM VERSION)
   ========================================================================== */

// Global scene components
let scene, camera, renderer;
let sun, mercury, venus, earth, clouds, moon, mars, jupiter, saturn, saturnRings, uranus, neptune;
let orbitLines = [];
let starLayers = []; // Multi-layered starfield for parallax depth
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

// Planet axial tilts in radians (Real astronomy data)
const AXIAL_TILTS = {
    mercury: 0.0005,  // 0.03 deg
    venus: 3.094,     // 177.3 deg (Retrograde spin)
    earth: 0.408,     // 23.4 deg
    mars: 0.440,      // 25.2 deg
    jupiter: 0.055,   // 3.1 deg
    saturn: 0.466,    // 26.7 deg
    uranus: 1.706,    // 97.8 deg (Spins on side)
    neptune: 0.494    // 28.3 deg
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
    scene.fog = new THREE.FogExp2(0x030308, 0.0015);
    
    // Camera setup
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.copy(currentCameraPos);
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.08); // faint space scattering
    scene.add(ambientLight);
    
    // Sun light (Point light casting outward)
    const sunLight = new THREE.PointLight(0xfff5e6, 2.2, 500, 0.5); // Warm solar light
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);
    
    // Cosmic gas / nebula fill lights
    const spaceLight1 = new THREE.DirectionalLight(0x00f2fe, 0.12);
    spaceLight1.position.set(100, 50, -100);
    scene.add(spaceLight1);
    const spaceLight2 = new THREE.DirectionalLight(0x7f00ff, 0.06);
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

// Helper to generate planet multi-channel materials (diffuse + bump maps)
function generatePlanetTextures(type, colorBase, colorDetail) {
    const size = 512;
    const canvas = document.createElement('canvas');
    const bCanvas = document.createElement('canvas'); // Bump map
    
    canvas.width = bCanvas.width = size;
    canvas.height = bCanvas.height = size / 2;
    
    const ctx = canvas.getContext('2d');
    const bCtx = bCanvas.getContext('2d');
    
    if (type === 'bands') {
        // Jupiter / Saturn clouds
        ctx.fillStyle = colorBase;
        ctx.fillRect(0, 0, size, size/2);
        bCtx.fillStyle = '#7f7f7f'; // Flat bump level
        bCtx.fillRect(0, 0, size, size/2);
        
        // Dynamic cloud bands
        for (let y = 0; y < size/2; y += Math.random() * 10 + 3) {
            ctx.fillStyle = Math.random() > 0.5 ? colorDetail : 'rgba(255,255,255,0.06)';
            ctx.fillRect(0, y, size, Math.random() * 6 + 1);
            
            // Subtle bump map ridges for gas bands
            bCtx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
            bCtx.fillRect(0, y, size, Math.random() * 6 + 1);
        }
        
        if (colorDetail === '#d14905') { // Jupiter storm spots
            // Great Red Spot
            ctx.fillStyle = '#b32b00';
            ctx.beginPath(); ctx.ellipse(320, 160, 25, 14, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2; ctx.stroke();
            
            bCtx.fillStyle = '#9f9f9f'; // storm is slightly elevated
            bCtx.beginPath(); bCtx.ellipse(320, 160, 25, 14, 0, 0, Math.PI * 2); bCtx.fill();
        }
    } 
    else if (type === 'cratered') {
        // Rocky planets (Mercury, Moon, Mars)
        ctx.fillStyle = colorBase;
        ctx.fillRect(0, 0, size, size/2);
        
        // Gray base bump map
        bCtx.fillStyle = '#7f7f7f';
        bCtx.fillRect(0, 0, size, size/2);
        
        // Multi-layered fine noise
        const img = ctx.getImageData(0, 0, size, size/2);
        const bImg = bCtx.getImageData(0, 0, size, size/2);
        const data = img.data;
        const bData = bImg.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 15;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));
            data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise));
            data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise));
            
            // Bump map noise
            bData[i] = Math.max(0, Math.min(255, bData[i] + noise * 1.5));
            bData[i+1] = Math.max(0, Math.min(255, bData[i+1] + noise * 1.5));
            bData[i+2] = Math.max(0, Math.min(255, bData[i+2] + noise * 1.5));
        }
        ctx.putImageData(img, 0, 0);
        bCtx.putImageData(bImg, 0, 0);
        
        // Draw Craters on both diffuse and bump map
        for (let i = 0; i < 35; i++) {
            const rx = Math.random() * size;
            const ry = Math.random() * (size / 2);
            const r = Math.random() * 12 + 2;
            
            // Diffuse shading
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.beginPath(); ctx.arc(rx, ry, r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
            
            // Bump map craters (embossed rings: dark inside, light rim)
            bCtx.fillStyle = '#606060'; // depressed crater floor
            bCtx.beginPath(); bCtx.arc(rx, ry, r, 0, Math.PI*2); bCtx.fill();
            
            bCtx.strokeStyle = '#ffffff'; // raised crater rim
            bCtx.lineWidth = 1;
            bCtx.beginPath(); bCtx.arc(rx, ry, r, 0, Math.PI*2); bCtx.stroke();
        }
    }
    
    return {
        map: new THREE.CanvasTexture(canvas),
        bumpMap: new THREE.CanvasTexture(bCanvas)
    };
}

// Generate Realistic Earth Multi-channel textures (specular + bump + clouds)
function generateEarthTextures() {
    const size = 512;
    const dCanvas = document.createElement('canvas'); // Diffuse
    const sCanvas = document.createElement('canvas'); // Specular (reflectiveness)
    const bCanvas = document.createElement('canvas'); // Bump (elevation)
    
    dCanvas.width = sCanvas.width = bCanvas.width = size;
    dCanvas.height = sCanvas.height = bCanvas.height = size / 2;
    
    const dCtx = dCanvas.getContext('2d');
    const sCtx = sCanvas.getContext('2d');
    const bCtx = bCanvas.getContext('2d');
    
    // Oceans: Diffuse deep blue, Specular highly reflective (white), Bump flat (mid gray)
    dCtx.fillStyle = '#0a233c'; dCtx.fillRect(0, 0, size, size/2);
    sCtx.fillStyle = '#ffffff'; sCtx.fillRect(0, 0, size, size/2);
    bCtx.fillStyle = '#7f7f7f'; bCtx.fillRect(0, 0, size, size/2);
    
    // Draw continental blobs
    const drawContinent = (x, y, r) => {
        // Diffuse (Green land, brown mountains)
        dCtx.fillStyle = '#223e1e';
        dCtx.beginPath(); dCtx.arc(x, y, r, 0, Math.PI*2); dCtx.fill();
        dCtx.fillStyle = '#4e3e2b';
        dCtx.beginPath(); dCtx.arc(x + r*0.2, y - r*0.1, r*0.5, 0, Math.PI*2); dCtx.fill();
        
        // Specular (Land is matte black, no reflections)
        sCtx.fillStyle = '#000000';
        sCtx.beginPath(); sCtx.arc(x, y, r, 0, Math.PI*2); sCtx.fill();
        
        // Bump (Land is elevated)
        bCtx.fillStyle = '#b0b0b0';
        bCtx.beginPath(); bCtx.arc(x, y, r, 0, Math.PI*2); bCtx.fill();
    };
    
    // Draw continent blocks
    drawContinent(100, 110, 48);
    drawContinent(140, 130, 38);
    drawContinent(180, 110, 58);
    drawContinent(120, 180, 28);
    drawContinent(360, 100, 44);
    drawContinent(380, 170, 38);
    drawContinent(340, 80, 32);
    drawContinent(260, 180, 22);
    
    // Polar Ice Caps
    dCtx.fillStyle = '#ffffff';
    dCtx.fillRect(0, 0, size, 22); dCtx.fillRect(0, size/2 - 20, size, 20);
    sCtx.fillStyle = '#3a3a3a'; // Ice is semi-reflective
    sCtx.fillRect(0, 0, size, 22); sCtx.fillRect(0, size/2 - 20, size, 20);
    bCtx.fillStyle = '#c5c5c5'; // Ice is slightly raised
    bCtx.fillRect(0, 0, size, 22); bCtx.fillRect(0, size/2 - 20, size, 20);
    
    // Add roughness noise to bump map land
    const bImg = bCtx.getImageData(0, 0, size, size/2);
    const bData = bImg.data;
    for (let i = 0; i < bData.length; i += 4) {
        if (bData[i] > 127) { // Only affect land
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

/* ==========================================================================
   COSMIC ENTITY CREATION (MULTI-LAYER STARS)
   ========================================================================== */

function createStarfield() {
    // 3 layered particle systems rotating at different speeds for parallax depth
    createStarLayer(4000, 0.45, 0.4, 900); // Far, faint stars
    createStarLayer(1500, 0.80, 0.7, 600); // Mid stars
    createStarLayer(400,  1.35, 0.9, 300); // Near, glowing stars
}

function createStarLayer(count, size, opacity, radiusRange) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
        // Place stars evenly distributed on a sphere shell
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
            colors[i * 3] = 0.0;     // Glowing Cyan
            colors[i * 3 + 1] = 0.9;
            colors[i * 3 + 2] = 1.0;
        } else if (rand > 0.7) {
            colors[i * 3] = 0.6;     // Glowing Purple
            colors[i * 3 + 1] = 0.1;
            colors[i * 3 + 2] = 0.9;
        } else {
            colors[i * 3] = 1.0;     // Soft White
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

function createAsteroidBelt() {
    const asteroidCount = 1800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(asteroidCount * 3);
    
    for (let i = 0; i < asteroidCount; i++) {
        const radius = 11 + Math.random() * 17;
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
    
    // Atmospheric Glow surrounding Sun (Additive Blending)
    const sunGlowGeo = new THREE.SphereGeometry(5.2, 32, 32);
    const sunGlowMat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    });
    const sunGlow = new THREE.Mesh(sunGlowGeo, sunGlowMat);
    sun.add(sunGlow);
    
    // Outer Corona Flare
    const sunCoronaGeo = new THREE.SphereGeometry(5.9, 32, 32);
    const sunCoronaMat = new THREE.MeshBasicMaterial({
        color: 0xff3300,
        transparent: true,
        opacity: 0.06,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    });
    const sunCorona = new THREE.Mesh(sunCoronaGeo, sunCoronaMat);
    sun.add(sunCorona);
    
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
    
    // Create mercury pivot (Axial tilt setup)
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
        specular: new THREE.Color(0x777777), // spec glint reflection
        shininess: 20 
    });
    earth = new THREE.Mesh(sphereGeometry, earthMat);
    earth.scale.setScalar(1.0);
    
    // Earth blue atmosphere glow envelope
    const earthGlowGeo = new THREE.SphereGeometry(1.12, 32, 32);
    const earthGlowMat = new THREE.MeshBasicMaterial({
        color: 0x00f2fe,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    });
    const earthGlow = new THREE.Mesh(earthGlowGeo, earthGlowMat);
    earth.add(earthGlow);
    
    // Earth Clouds
    const cloudTexture = generateProceduralTexture('clouds');
    const cloudMat = new THREE.MeshStandardMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: 0.42
    });
    clouds = new THREE.Mesh(new THREE.SphereGeometry(1.025, 32, 32), cloudMat);
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
        opacity: 0.85,
        roughness: 0.4
    });
    saturnRings = new THREE.Mesh(ringGeo, ringMat);
    saturnRings.rotation.x = Math.PI * 0.45;
    saturnRings.rotation.y = Math.PI * 0.1;
    saturn.add(saturnRings);
    
    const saturnPivot = new THREE.Group();
    saturnPivot.position.copy(PLANET_POSITIONS.saturn);
    saturnPivot.rotation.z = AXIAL_TILTS.saturn;
    saturnPivot.add(saturn);
    scene.add(saturnPivot);
    
    // 8. URANUS
    const uranusTexture = generateProceduralTexture('bands', '#b0e7eb', '#67adb5');
    const uranusMat = new THREE.MeshPhongMaterial({ map: uranusTexture, shininess: 5 });
    uranus = new THREE.Mesh(sphereGeometry, uranusMat);
    uranus.scale.setScalar(1.2);
    
    const uranusPivot = new THREE.Group();
    uranusPivot.position.copy(PLANET_POSITIONS.uranus);
    uranusPivot.rotation.z = AXIAL_TILTS.uranus;
    uranusPivot.add(uranus);
    scene.add(uranusPivot);
    
    // 9. NEPTUNE
    const neptTexture = generateProceduralTexture('bands', '#305494', '#0d1d3f');
    const neptMat = new THREE.MeshPhongMaterial({ map: neptTexture, shininess: 5 });
    neptune = new THREE.Mesh(sphereGeometry, neptMat);
    neptune.scale.setScalar(1.15);
    
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
    
    // 2. Camera FOV Warp Speed decay effect on scroll
    camera.fov += (fovWarpTarget - camera.fov) * 0.08;
    fovWarpTarget += (45 - fovWarpTarget) * 0.06; // decay back to 45
    camera.updateProjectionMatrix();
    
    // 3. Planet self rotations on axial tilts
    const time = Date.now() * 0.0003;
    
    if (sun) sun.rotation.y = time * 0.2;
    if (mercury) mercury.rotation.y = time * 0.4;
    if (venus) venus.rotation.y = -time * 0.35; // spins backward
    
    if (earth) {
        earth.rotation.y = time * 0.8;
        if (clouds) clouds.rotation.y = time * 0.92; // clouds drift independently
        
        // Moon orbiting Earth
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
    }
    if (neptune) neptune.rotation.y = time * 1.35;
    
    // 4. Belt & Multi-layer Starfield drift
    if (asteroids) {
        asteroids.rotation.y = time * 0.06;
    }
    
    // Parallax Star layers rotation
    starLayers.forEach((layer, idx) => {
        layer.rotation.y = time * (0.006 * (idx + 1));
        layer.rotation.x = time * (0.002 * (idx + 1));
        
        // Stretch stars slightly along Z axis based on velocity warping
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
