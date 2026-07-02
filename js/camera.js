import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';

export const currentCameraPos = new THREE.Vector3(0, 10, 50);
export const currentCameraTarget = new THREE.Vector3(0, 0, 0);
export const targetCameraPos = new THREE.Vector3(0, 10, 50);
export const targetCameraTarget = new THREE.Vector3(0, 0, 0);

export let fovWarpTarget = 45;
export function setFovWarpTarget(val) { fovWarpTarget = val; }

export const KEYFRAMES = [
    { pos: new THREE.Vector3(0, 20, 75), lookAt: new THREE.Vector3(0, 0, 0) }, // 0. Home
    { pos: new THREE.Vector3(25, 2, -3), lookAt: new THREE.Vector3(12, 0, -5) }, // 1. Profile
    { pos: new THREE.Vector3(-15, 1, -40), lookAt: new THREE.Vector3(-6, 0, -45) }, // 2. Skills
    { pos: new THREE.Vector3(-32, 1.5, -83), lookAt: new THREE.Vector3(-20, 0, -85) }, // 3. Experience
    { pos: new THREE.Vector3(26, 4, -130), lookAt: new THREE.Vector3(38, 0, -135) }, // 4. Projects
    { pos: new THREE.Vector3(-45, 6, -190), lookAt: new THREE.Vector3(-30, 0, -195) }, // 5. Certifications
    { pos: new THREE.Vector3(-65, 38, -120), lookAt: new THREE.Vector3(0, -3, -30) } // 6. Contact
];

export function createCamera() {
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.copy(currentCameraPos);
    return camera;
}
