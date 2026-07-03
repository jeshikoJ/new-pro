import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';
import { 
    generateProceduralTexture, 
    generatePlanetTextures, 
    generateEarthTextures, 
    generateSaturnRingTexture 
} from './utils.js';

// Global variables for celestial bodies
export let sun, mercury, venus, earth, clouds, moon, mars, jupiter, io, saturn, saturnRings, titan, uranus, neptune;
export let uranusRings, neptuneRings;
export let sunRays1, sunRays2;
export const orbitLines = [];
export const comets = [];

// Planet axial tilts in radians
export const AXIAL_TILTS = {
    mercury: 0.0005,
    venus: 3.094,
    earth: 0.408,
    mars: 0.440,
    jupiter: 0.055,
    saturn: 0.466,
    uranus: 1.706,
    neptune: 0.494
};

// Orbital radii in space units
export const ORBIT_RADII = {
    mercury: 12,
    venus: 18,
    earth: 25,
    mars: 32,
    jupiter: 44,
    saturn: 56,
    uranus: 68,
    neptune: 80
};

// Orbital speeds (relative and artistically damped)
export const ORBIT_SPEEDS = {
    mercury: 1.2,
    venus: 0.8,
    earth: 0.5,
    mars: 0.35,
    jupiter: 0.16,
    saturn: 0.09,
    uranus: 0.05,
    neptune: 0.02
};

// Target locking offsets for camera (relative to planet position)
export const CAMERA_OFFSETS = {
    venus: new THREE.Vector3(6, 1.2, 7),
    earth: new THREE.Vector3(-6, 0.8, -8),
    mars: new THREE.Vector3(4.5, 0.6, 5.5),
    jupiter: new THREE.Vector3(-8.5, 2.5, -11),
    saturn: new THREE.Vector3(11, 3.2, 13)
};

export function createCelestialBodies(scene) {
    const sphereGeometry = new THREE.SphereGeometry(1, 64, 64);
    
    // 1. SUN
    const sunTexture = generateProceduralTexture('sun');
    const sunMat = new THREE.MeshBasicMaterial({ map: sunTexture });
    sun = new THREE.Mesh(new THREE.SphereGeometry(4.5, 64, 64), sunMat);
    sun.position.set(0, 0, 0);
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
        depthWrite: false,
        fog: false
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
    
    mercury.pivot = new THREE.Group();
    mercury.pivot.rotation.z = AXIAL_TILTS.mercury;
    mercury.pivot.add(mercury);
    scene.add(mercury.pivot);
    
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
    
    venus.pivot = new THREE.Group();
    venus.pivot.rotation.z = AXIAL_TILTS.venus;
    venus.pivot.add(venus);
    scene.add(venus.pivot);
    
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
    clouds.castShadow = true;
    clouds.receiveShadow = true;
    earth.add(clouds);
    
    earth.pivot = new THREE.Group();
    earth.pivot.rotation.z = AXIAL_TILTS.earth;
    earth.pivot.add(earth);
    scene.add(earth.pivot);
    
    // Moon
    const moonTexture = generateProceduralTexture('cratered', '#909090', '#3b3b3b');
    const moonMat = new THREE.MeshPhongMaterial({ map: moonTexture, shininess: 2 });
    moon = new THREE.Mesh(sphereGeometry, moonMat);
    moon.scale.setScalar(0.24);
    moon.castShadow = true;
    moon.receiveShadow = true;
    earth.pivot.add(moon);
    
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
    
    mars.pivot = new THREE.Group();
    mars.pivot.rotation.z = AXIAL_TILTS.mars;
    mars.pivot.add(mars);
    scene.add(mars.pivot);
    
    // 6. JUPITER & MOONS
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
    
    jupiter.pivot = new THREE.Group();
    jupiter.pivot.rotation.z = AXIAL_TILTS.jupiter;
    jupiter.pivot.add(jupiter);
    scene.add(jupiter.pivot);
    
    // Io (Jupiter's Moon)
    const ioTexture = generateProceduralTexture('cratered', '#e6e655', '#998f2b');
    const ioMat = new THREE.MeshPhongMaterial({ map: ioTexture, shininess: 1 });
    io = new THREE.Mesh(sphereGeometry, ioMat);
    io.scale.setScalar(0.2);
    io.castShadow = true;
    io.receiveShadow = true;
    jupiter.pivot.add(io);
    
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
    if (ringGeo.attributes && ringGeo.attributes.position && ringGeo.attributes.uv) {
        const posAttribute = ringGeo.attributes.position;
        const uvAttribute = ringGeo.attributes.uv;
        for (let i = 0; i < posAttribute.count; i++) {
            const x = posAttribute.getX(i);
            const y = posAttribute.getY(i);
            const distance = Math.sqrt(x*x + y*y);
            const u = (distance - 1.4) / (2.5 - 1.4);
            uvAttribute.setXY(i, u, 0.5);
        }
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
    
    saturn.pivot = new THREE.Group();
    saturn.pivot.rotation.z = AXIAL_TILTS.saturn;
    saturn.pivot.add(saturn);
    scene.add(saturn.pivot);
    
    // Titan (Saturn's Moon)
    const titanTexture = generateProceduralTexture('bands', '#e6a15c', '#a6672d');
    const titanMat = new THREE.MeshPhongMaterial({ map: titanTexture, shininess: 3 });
    titan = new THREE.Mesh(sphereGeometry, titanMat);
    titan.scale.setScalar(0.28);
    titan.castShadow = true;
    titan.receiveShadow = true;
    saturn.pivot.add(titan);
    
    // 8. URANUS & Rings
    const uranusMaps = generatePlanetTextures('bands', '#b0e7eb', '#67adb5');
    const uranusMat = new THREE.MeshPhongMaterial({ 
        map: uranusMaps.map, 
        bumpMap: uranusMaps.bumpMap,
        bumpScale: 0.01,
        shininess: 5 
    });
    uranus = new THREE.Mesh(sphereGeometry, uranusMat);
    uranus.scale.setScalar(1.2);
    uranus.castShadow = true;
    uranus.receiveShadow = true;
    
    // Uranus Ring (vertical)
    const uranusRingGeo = new THREE.RingGeometry(1.4, 1.6, 64);
    const uranusRingMat = new THREE.MeshBasicMaterial({
        color: 0xa8e1e6,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.25
    });
    uranusRings = new THREE.Mesh(uranusRingGeo, uranusRingMat);
    uranusRings.rotation.x = Math.PI * 0.5;
    uranusRings.rotation.y = Math.PI * 0.05;
    uranus.add(uranusRings);
    
    uranus.pivot = new THREE.Group();
    uranus.pivot.rotation.z = AXIAL_TILTS.uranus;
    uranus.pivot.add(uranus);
    scene.add(uranus.pivot);
    
    // 9. NEPTUNE & Rings
    const neptMaps = generatePlanetTextures('bands', '#305494', '#0d1d3f');
    const neptMat = new THREE.MeshPhongMaterial({ 
        map: neptMaps.map, 
        bumpMap: neptMaps.bumpMap,
        bumpScale: 0.01,
        shininess: 5 
    });
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
    
    neptune.pivot = new THREE.Group();
    neptune.pivot.rotation.z = AXIAL_TILTS.neptune;
    neptune.pivot.add(neptune);
    scene.add(neptune.pivot);
}

export function createOrbitRings(scene) {
    // Clear list to prevent duplicates
    orbitLines.length = 0;
    
    const material = new THREE.LineBasicMaterial({
        color: 0x00f2fe,
        transparent: true,
        opacity: 0.06
    });
    
    const radii = [
        ORBIT_RADII.mercury,
        ORBIT_RADII.venus,
        ORBIT_RADII.earth,
        ORBIT_RADII.mars,
        ORBIT_RADII.jupiter,
        ORBIT_RADII.saturn,
        ORBIT_RADII.uranus,
        ORBIT_RADII.neptune
    ];
    
    radii.forEach(radius => {
        const segments = 128;
        const geometry = new THREE.BufferGeometry();
        const points = [];
        
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
        }
        
        geometry.setFromPoints(points);
        const lineMat = material.clone();
        const line = new THREE.Line(geometry, lineMat);
        scene.add(line);
        orbitLines.push(line);
    });
}

export function createComets(scene) {
    // Clear list to prevent duplicates
    comets.length = 0;
    
    const cometColors = [0xccf2ff, 0xffcccc];
    
    for (let i = 0; i < 2; i++) {
        const cometGroup = new THREE.Group();
        
        const nucGeo = new THREE.SphereGeometry(0.08, 16, 16);
        const nucMat = new THREE.MeshBasicMaterial({ color: cometColors[i], fog: false });
        const nucleus = new THREE.Mesh(nucGeo, nucMat);
        cometGroup.add(nucleus);
        
        const tailGeo = new THREE.ConeGeometry(0.12, 1.8, 16);
        tailGeo.rotateX(Math.PI / 2);
        const tailMat = new THREE.MeshBasicMaterial({
            color: cometColors[i],
            transparent: true,
            opacity: 0.22,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            fog: false
        });
        const tail = new THREE.Mesh(tailGeo, tailMat);
        tail.position.set(0, 0, 0.9);
        cometGroup.add(tail);
        
        scene.add(cometGroup);
        comets.push({
            group: cometGroup,
            tail: tail,
            speed: 0.05 + Math.random() * 0.05,
            offset: Math.random() * Math.PI * 2,
            a: 75 + i*15,
            b: 22 + i*5
        });
    }
}
