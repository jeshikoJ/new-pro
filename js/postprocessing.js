import * as THREE from 'https://esm.sh/three@0.128.0';
import { EffectComposer } from 'https://esm.sh/three@0.128.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://esm.sh/three@0.128.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://esm.sh/three@0.128.0/examples/jsm/postprocessing/UnrealBloomPass.js';

export let composer;

export function initPostProcessing(scene, camera, renderer) {
    try {
        const renderPass = new RenderPass(scene, camera);
        
        // Premium subtle bloom configuration
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.65, // strength
            0.4,  // radius
            0.85  // threshold (avoids blowing out bright panels)
        );
        
        composer = new EffectComposer(renderer);
        composer.addPass(renderPass);
        composer.addPass(bloomPass);
        
        return composer;
    } catch (e) {
        console.warn("Postprocessing initialization failed, falling back to standard rendering:", e);
        composer = null;
        return null;
    }
}
