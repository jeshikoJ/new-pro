import * as THREE from 'https://esm.sh/three@0.128.0';
import { 
    sun, mercury, venus, earth, clouds, moon, mars, jupiter, io, saturn, saturnRings, titan, uranus, neptune,
    uranusRings, neptuneRings, sunRays1, sunRays2, orbitLines, comets,
    AXIAL_TILTS, ORBIT_RADII, ORBIT_SPEEDS, CAMERA_OFFSETS, KEYFRAMES
} from './planets.js';
import { starLayers } from './stars.js';
import { asteroids, nebulae, updateSpaceDust } from './particles.js';
import { mouseX, mouseY } from './controls.js';
import { cameraLight } from './lighting.js';
import { composer } from './postprocessing.js';
import { currentCameraPos, currentCameraTarget, targetCameraPos, targetCameraTarget, fovWarpTarget } from './camera.js';

let scene, camera, renderer;

export function setAnimationContext(s, c, r) {
    scene = s;
    camera = c;
    renderer = r;
}

export function animate() {
    requestAnimationFrame(animate);
    
    const time = Date.now() * 0.0003;
    
    // 1. Dynamic Physics-inspired Orbital Movements
    if (mercury && mercury.pivot) {
        const theta = time * ORBIT_SPEEDS.mercury;
        mercury.pivot.position.set(Math.cos(theta) * ORBIT_RADII.mercury, 0, Math.sin(theta) * ORBIT_RADII.mercury);
        mercury.rotation.y = time * 0.9;
    }
    if (venus && venus.pivot) {
        const theta = time * ORBIT_SPEEDS.venus;
        venus.pivot.position.set(Math.cos(theta) * ORBIT_RADII.venus, 0, Math.sin(theta) * ORBIT_RADII.venus);
        venus.rotation.y = -time * 0.5;
        
        KEYFRAMES[1].lookAt.copy(venus.pivot.position);
        KEYFRAMES[1].pos.copy(venus.pivot.position).add(CAMERA_OFFSETS.venus);
    }
    if (earth && earth.pivot) {
        const theta = time * ORBIT_SPEEDS.earth;
        earth.pivot.position.set(Math.cos(theta) * ORBIT_RADII.earth, 0, Math.sin(theta) * ORBIT_RADII.earth);
        earth.rotation.y = time * 0.8;
        if (clouds) clouds.rotation.y = time * 0.92;
        
        if (moon) {
            const moonSpeed = time * 1.5;
            moon.position.set(Math.cos(moonSpeed) * 2.8, 0, Math.sin(moonSpeed) * 2.8);
            moon.rotation.y = moonSpeed;
        }
        
        KEYFRAMES[2].lookAt.copy(earth.pivot.position);
        KEYFRAMES[2].pos.copy(earth.pivot.position).add(CAMERA_OFFSETS.earth);
    }
    if (mars && mars.pivot) {
        const theta = time * ORBIT_SPEEDS.mars;
        mars.pivot.position.set(Math.cos(theta) * ORBIT_RADII.mars, 0, Math.sin(theta) * ORBIT_RADII.mars);
        mars.rotation.y = time * 0.75;
        
        KEYFRAMES[3].lookAt.copy(mars.pivot.position);
        KEYFRAMES[3].pos.copy(mars.pivot.position).add(CAMERA_OFFSETS.mars);
    }
    if (jupiter && jupiter.pivot) {
        const theta = time * ORBIT_SPEEDS.jupiter;
        jupiter.pivot.position.set(Math.cos(theta) * ORBIT_RADII.jupiter, 0, Math.sin(theta) * ORBIT_RADII.jupiter);
        jupiter.rotation.y = time * 1.8;
        
        if (io) {
            const ioSpeed = time * 2.2;
            io.position.set(Math.cos(ioSpeed) * 4.5, 0, Math.sin(ioSpeed) * 4.5);
            io.rotation.y = ioSpeed;
        }
        
        KEYFRAMES[4].lookAt.copy(jupiter.pivot.position);
        KEYFRAMES[4].pos.copy(jupiter.pivot.position).add(CAMERA_OFFSETS.jupiter);
    }
    if (saturn && saturn.pivot) {
        const theta = time * ORBIT_SPEEDS.saturn;
        saturn.pivot.position.set(Math.cos(theta) * ORBIT_RADII.saturn, 0, Math.sin(theta) * ORBIT_RADII.saturn);
        saturn.rotation.y = time * 1.5;
        if (saturnRings) saturnRings.rotation.z = -time * 0.1;
        
        if (titan) {
            const titanSpeed = time * 1.2;
            titan.position.set(Math.cos(titanSpeed) * 5.8, 0, Math.sin(titanSpeed) * 5.8);
            titan.rotation.y = titanSpeed;
        }
        
        KEYFRAMES[5].lookAt.copy(saturn.pivot.position);
        KEYFRAMES[5].pos.copy(saturn.pivot.position).add(CAMERA_OFFSETS.saturn);
    }
    if (uranus && uranus.pivot) {
        const theta = time * ORBIT_SPEEDS.uranus;
        uranus.pivot.position.set(Math.cos(theta) * ORBIT_RADII.uranus, 0, Math.sin(theta) * ORBIT_RADII.uranus);
        uranus.rotation.y = -time * 1.1;
        if (uranusRings) uranusRings.rotation.y = time * 0.05;
    }
    if (neptune && neptune.pivot) {
        const theta = time * ORBIT_SPEEDS.neptune;
        neptune.pivot.position.set(Math.cos(theta) * ORBIT_RADII.neptune, 0, Math.sin(theta) * ORBIT_RADII.neptune);
        neptune.rotation.y = time * 1.2;
        if (neptuneRings) neptuneRings.rotation.z = -time * 0.1;
    }
    
    // 2. Smooth Camera Flight (Lerp) & Handheld Camera Breathing
    if (camera) {
        currentCameraPos.lerp(targetCameraPos, 0.035);
        currentCameraTarget.lerp(targetCameraTarget, 0.035);
        
        // Gentle cinematic handheld float (sine-based camera breathing)
        const breathX = Math.sin(time * 1.8) * 0.55;
        const breathY = Math.cos(time * 1.3) * 0.4;
        const breathZ = Math.sin(time * 0.7) * 0.5;
        
        camera.position.copy(currentCameraPos);
        camera.position.x += breathX;
        camera.position.y += breathY;
        camera.position.z += breathZ;
        
        // Apply mouse parallax drift
        camera.position.x += (mouseX - camera.position.x * 0.005) * 0.1;
        camera.position.y += (-mouseY - camera.position.y * 0.005) * 0.1;
        
        // Smooth target lookAt breathing
        const tempTarget = currentCameraTarget.clone();
        tempTarget.x += Math.sin(time * 1.0) * 0.2;
        tempTarget.y += Math.cos(time * 0.8) * 0.15;
        camera.lookAt(tempTarget);
        
        // Update camera headlight position to match camera
        if (cameraLight) {
            cameraLight.position.copy(camera.position);
        }
        
        // 3. Camera FOV Warp Speed decay
        camera.fov += (fovWarpTarget - camera.fov) * 0.08;
        camera.updateProjectionMatrix();
    }
    
    // 4. Volumetric Sun Flare shimmers & heatwave pulses
    if (sun) {
        const sunPulse = 1.0 + Math.sin(time * 2.2) * 0.012;
        sun.scale.set(sunPulse, sunPulse, sunPulse);
    }
    if (sunRays1) {
        sunRays1.rotation.z = time * 0.07;
        const rayPulse = 1.0 + Math.sin(time * 3.5) * 0.035;
        sunRays1.scale.set(rayPulse, rayPulse, rayPulse);
    }
    if (sunRays2) {
        sunRays2.rotation.z = -time * 0.04;
        const rayPulse = 1.0 + Math.cos(time * 2.8) * 0.03;
        sunRays2.scale.set(rayPulse, rayPulse, rayPulse);
    }
    
    // 5. Instanced 3D Belt revolving centered at Sun
    if (asteroids) {
        asteroids.rotation.y = time * 0.06;
    }
    
    // 6. Comet highly eccentric orbit animation & sublimation tail growth
    comets.forEach(comet => {
        const t = time * comet.speed + comet.offset;
        const x = Math.cos(t) * comet.a;
        const z = Math.sin(t) * comet.b;
        const y = Math.sin(t) * (comet.b * 0.35);
        
        comet.group.position.set(x, y, z);
        comet.tail.lookAt(0, 0, 0);
        
        // Dynamically scale tail length and opacity based on proximity to the Sun
        const dist = Math.sqrt(x*x + y*y + z*z);
        const proximity = 1.0 - Math.min(1.0, Math.max(0.0, (dist - comet.b) / (comet.a - comet.b)));
        const tailLen = 0.5 + proximity * 1.6;
        comet.tail.scale.set(1.0, 1.0, tailLen);
        comet.tail.material.opacity = 0.1 + proximity * 0.32;
    });
    
    // 7. Pulse orbit lines glow independently
    orbitLines.forEach((line, idx) => {
        line.material.opacity = 0.04 + Math.sin(time * 1.5 + idx * 0.8) * 0.025;
    });
    
    // 8. Nebula slow drifting rotation
    nebulae.forEach((neb, idx) => {
        neb.rotation.z = time * (0.015 * (idx + 1));
    });
    
    // 9. Star layers drift & twinkle
    starLayers.forEach((layer, idx) => {
        layer.rotation.y = time * (0.006 * (idx + 1));
        layer.rotation.x = time * (0.002 * (idx + 1));
        
        const baseOpacity = idx === 0 ? 0.45 : (idx === 1 ? 0.70 : 0.90);
        layer.material.opacity = baseOpacity + Math.sin(time * 3.5 + idx * 2.0) * 0.08;
        
        if (camera) {
            const warpForce = Math.abs(camera.fov - 45) * 0.05;
            layer.scale.set(1, 1, 1 + warpForce);
        }
    });
    
    // 10. Update Space Dust drift animation
    updateSpaceDust();
    
    // Render
    if (composer) {
        composer.render();
    } else if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}
