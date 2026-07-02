import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';

export let cameraLight;

export function setupLighting(scene, camera) {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.12);
    scene.add(ambientLight);
    
    // Headlight
    cameraLight = new THREE.PointLight(0xffffff, 0.75, 300, 0.55);
    cameraLight.position.copy(camera.position);
    scene.add(cameraLight);
    
    // Sun PointLight (shadow casting)
    const sunLight = new THREE.PointLight(0xfff5e6, 2.5, 550, 0.45);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 380;
    sunLight.shadow.bias = -0.002;
    scene.add(sunLight);
    
    // Distant cosmic lights
    const spaceLight1 = new THREE.DirectionalLight(0x00f2fe, 0.08);
    spaceLight1.position.set(100, 50, -100);
    scene.add(spaceLight1);
    
    const spaceLight2 = new THREE.DirectionalLight(0x7f00ff, 0.04);
    spaceLight2.position.set(-100, -50, -200);
    scene.add(spaceLight2);
    
    return { ambientLight, cameraLight, sunLight, spaceLight1, spaceLight2 };
}
