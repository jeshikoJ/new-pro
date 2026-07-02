import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';

export const starLayers = [];

export function createStarfield(scene) {
    // Clear list to prevent duplicates on re-init
    starLayers.length = 0;
    
    createStarLayer(scene, 4000, 1.0, 0.45, 900);
    createStarLayer(scene, 1500, 1.5, 0.70, 600);
    createStarLayer(scene, 400,  2.0, 0.90, 300);
}

function createStarLayer(scene, count, size, opacity, radiusRange) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
        const r = (Math.random() * 0.5 + 0.5) * radiusRange;
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    let colorVal = 0xffffff;
    if (radiusRange === 300) {
        colorVal = 0x00f2fe; // Cyan
    } else if (radiusRange === 600) {
        colorVal = 0x7f00ff; // Purple
    }
    
    const material = new THREE.PointsMaterial({
        size: size,
        color: colorVal,
        transparent: true,
        opacity: opacity,
        sizeAttenuation: false,
        fog: false
    });
    
    const layer = new THREE.Points(geometry, material);
    scene.add(layer);
    starLayers.push(layer);
}
