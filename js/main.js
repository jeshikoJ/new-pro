import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { createScene } from './scene.js';
import { createCamera, updateCameraPath } from './camera.js';
import { createRenderer } from './renderer.js';
import { setupLighting } from './lighting.js';
import { createCelestialBodies, createOrbitRings, createComets } from './planets.js';
import { createStarfield } from './stars.js';
import { createAsteroidBelt, createSpaceDust, createNebulae } from './particles.js';
import { handleScroll, onMouseMove, updateCursorFollower, setupCardTilts, typeEffect } from './controls.js';
import { initPostProcessing } from './postprocessing.js';
import { setAnimationContext, animate } from './animation.js';

export let scene, camera, renderer;

function initThree() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) {
        throw new Error("Canvas element '#bg-canvas' not found on the page.");
    }
    
    // 1. Scene, Camera, Renderer Setup
    scene = createScene();
    camera = createCamera();
    renderer = createRenderer(canvas);
    
    // 2. Cosmic Lights Setup
    setupLighting(scene, camera);
    
    // 3. Creation of Galactic Systems
    createStarfield(scene);
    createCelestialBodies(scene);
    createAsteroidBelt(scene);
    createOrbitRings(scene);
    createComets(scene);
    createSpaceDust(scene);
    createNebulae(scene);
    
    // 4. Post-processing Composer Pipeline (Subtle Bloom)
    initPostProcessing(scene, camera, renderer);
    
    // 5. Connect modules to the shared Animation Context
    setAnimationContext(scene, camera, renderer);
    
    // 6. Setup initial keyframe positions
    updateCameraPath(0);
    
    // 7. Core interaction event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('scroll', handleScroll);
}

function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Global DOM hooks & startup configuration
document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.querySelector('.nav-mobile-btn');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-links a');
    
    // Mobile navigation panel toggle
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('mobile-active');
            menuBtn.querySelector('i').classList.toggle('fa-bars');
            menuBtn.querySelector('i').classList.toggle('fa-xmark');
        });
    }
    
    // Smooth scrolling links behavior
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
    
    // Cursor hover effects tracking
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
    
    // Scroll Entrance Slide observer setup
    const slides = document.querySelectorAll('.sec-slide');
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.18
    };
    
    const slideObserver = new IntersectionObserver((entries) => {
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
    
    // Bootstrap WebGL space rendering
    try {
        initThree();
        animate();
    } catch (err) {
        console.error("Three.js initialization failed:", err);
    }
    
    // Launch secondary loop listeners
    handleScroll();
    typeEffect();
    updateCursorFollower();
    setupCardTilts();
});
