import * as THREE from 'three';
import { generateProceduralTexture } from './utils.js';

export let asteroids;
export const nebulae = [];
export let spaceDust;

export function createAsteroidBelt(scene) {
    const count = 350;
    const rockGeo = new THREE.DodecahedronGeometry(0.12, 1);
    
    const rockMat = new THREE.MeshStandardMaterial({
        color: 0x5a544f,
        roughness: 0.95,
        metalness: 0.05
    });
    
    if (THREE.InstancedMesh) {
        asteroids = new THREE.InstancedMesh(rockGeo, rockMat, count);
        asteroids.castShadow = true;
        asteroids.receiveShadow = true;
        
        const dummy = new THREE.Object3D();
        
        for (let i = 0; i < count; i++) {
            const radius = 12 + Math.random() * 16;
            const angle = Math.random() * Math.PI * 2;
            
            const x = Math.cos(angle) * radius;
            const y = (Math.random() - 0.5) * 1.8;
            const z = Math.sin(angle) * radius;
            
            dummy.position.set(x, y, z);
            dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            const scale = Math.random() * 0.8 + 0.4;
            dummy.scale.set(scale, scale, scale);
            
            dummy.updateMatrix();
            asteroids.setMatrixAt(i, dummy.matrix);
        }
        
        scene.add(asteroids);
    }
}

export function createSpaceDust(scene) {
    const count = 800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 120;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
        speeds[i] = 0.05 + Math.random() * 0.15;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        size: 0.25,
        color: 0x00f2fe,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    spaceDust = new THREE.Points(geometry, material);
    scene.add(spaceDust);
    spaceDust.userData = { positions, speeds };
}

export function updateSpaceDust() {
    if (!spaceDust) return;
    const positions = spaceDust.geometry.attributes.position.array;
    const speeds = spaceDust.userData.speeds;
    const count = speeds.length;
    
    for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] -= speeds[i] * 0.05; // slowly drift down
        if (positions[i * 3 + 1] < -25) {
            positions[i * 3 + 1] = 25; // recycle
        }
    }
    spaceDust.geometry.attributes.position.needsUpdate = true;
}

export function createNebulae(scene) {
    // Clear list to prevent duplicates
    nebulae.length = 0;
    
    const cloudColors = [
        'rgba(0, 242, 254, 0.6)',
        'rgba(127, 0, 255, 0.6)',
        'rgba(255, 0, 127, 0.6)'
    ];
    
    const depths = [-350, -420, -280];
    const positions = [
        new THREE.Vector3(-110, -40, depths[0]),
        new THREE.Vector3(120, 50, depths[1]),
        new THREE.Vector3(-40, 80, depths[2])
    ];
    
    for (let i = 0; i < 3; i++) {
        const tex = generateProceduralTexture('nebula', cloudColors[i]);
        const mat = new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
            opacity: 0.16,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            fog: false
        });
        
        const geom = new THREE.PlaneGeometry(350, 350);
        const plane = new THREE.Mesh(geom, mat);
        plane.position.copy(positions[i]);
        
        scene.add(plane);
        nebulae.push(plane);
    }
}
