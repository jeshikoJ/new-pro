import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';

export function createScene() {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020206, 0.001);
    return scene;
}
