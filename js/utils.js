import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';

export function generateProceduralTexture(type, colorBase, colorDetail) {
    const size = type === 'sunray' || type === 'nebula' ? 512 : 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = type === 'sunray' || type === 'nebula' ? size : size / 2;
    const ctx = canvas.getContext('2d');
    
    if (type === 'sun') {
        const grad = ctx.createLinearGradient(0, 0, size, 0);
        grad.addColorStop(0, '#ffdd33');
        grad.addColorStop(0.2, '#ff8800');
        grad.addColorStop(0.5, '#ff3300');
        grad.addColorStop(0.8, '#ff8800');
        grad.addColorStop(1, '#ffdd33');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size/2);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
        for (let i = 0; i < 60; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * size, Math.random() * (size/2), Math.random() * 80 + 20, 0, Math.PI * 2);
            ctx.fill();
        }
    } 
    else if (type === 'sunray') {
        ctx.clearRect(0, 0, size, size);
        const grad = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
        grad.addColorStop(0, 'rgba(255, 210, 100, 0.9)');
        grad.addColorStop(0.25, 'rgba(255, 120, 0, 0.35)');
        grad.addColorStop(0.6, 'rgba(255, 45, 0, 0.08)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(256, 256, 256, 0, Math.PI * 2); ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 180, 50, 0.1)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 45; i++) {
            const angle = Math.random() * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(256, 256);
            ctx.lineTo(256 + Math.cos(angle)*256, 256 + Math.sin(angle)*256);
            ctx.stroke();
        }
    }
    else if (type === 'clouds') {
        ctx.clearRect(0, 0, size, size/2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        for (let i = 0; i < 60; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * size, Math.random() * (size/2 - 100) + 50, Math.random() * 60 + 15, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    else if (type === 'nebula') {
        ctx.clearRect(0, 0, size, size);
        const grad = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
        grad.addColorStop(0, colorBase);
        grad.addColorStop(0.3, colorBase.replace('0.6', '0.2'));
        grad.addColorStop(0.7, colorBase.replace('0.6', '0.05'));
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(256, 256, 256, 0, Math.PI * 2); ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    if (type !== 'sunray' && type !== 'nebula') {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
    }
    return texture;
}

export function generatePlanetTextures(type, colorBase, colorDetail) {
    const size = 1024;
    const canvas = document.createElement('canvas');
    const bCanvas = document.createElement('canvas');
    
    canvas.width = bCanvas.width = size;
    canvas.height = bCanvas.height = size / 2;
    
    const ctx = canvas.getContext('2d');
    const bCtx = bCanvas.getContext('2d');
    
    if (type === 'bands') {
        ctx.fillStyle = colorBase;
        ctx.fillRect(0, 0, size, size/2);
        bCtx.fillStyle = '#7f7f7f';
        bCtx.fillRect(0, 0, size, size/2);
        
        for (let y = 0; y < size/2; y += Math.random() * 15 + 5) {
            ctx.fillStyle = Math.random() > 0.5 ? colorDetail : 'rgba(255,255,255,0.06)';
            ctx.fillRect(0, y, size, Math.random() * 8 + 1);
            
            bCtx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
            bCtx.fillRect(0, y, size, Math.random() * 8 + 1);
        }
        
        if (colorDetail === '#d14905') { // Jupiter Red Spot
            ctx.fillStyle = '#b32b00';
            ctx.beginPath(); ctx.ellipse(640, 320, 50, 28, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 3; ctx.stroke();
            
            bCtx.fillStyle = '#9f9f9f';
            bCtx.beginPath(); bCtx.ellipse(640, 320, 50, 28, 0, 0, Math.PI * 2); bCtx.fill();
        }
    } 
    else if (type === 'cratered') {
        ctx.fillStyle = colorBase;
        ctx.fillRect(0, 0, size, size/2);
        
        bCtx.fillStyle = '#7f7f7f';
        bCtx.fillRect(0, 0, size, size/2);
        
        const img = ctx.getImageData(0, 0, size, size/2);
        const bImg = bCtx.getImageData(0, 0, size, size/2);
        const data = img.data;
        const bData = bImg.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 16;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));
            data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise));
            data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise));
            
            bData[i] = Math.max(0, Math.min(255, bData[i] + noise * 1.5));
            bData[i+1] = Math.max(0, Math.min(255, bData[i+1] + noise * 1.5));
            bData[i+2] = Math.max(0, Math.min(255, bData[i+2] + noise * 1.5));
        }
        ctx.putImageData(img, 0, 0);
        bCtx.putImageData(bImg, 0, 0);
        
        // Draw Craters
        for (let i = 0; i < 55; i++) {
            const rx = Math.random() * size;
            const ry = Math.random() * (size / 2);
            const r = Math.random() * 20 + 3;
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
            ctx.beginPath(); ctx.arc(rx, ry, r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
            
            bCtx.fillStyle = '#5c5c5c';
            bCtx.beginPath(); bCtx.arc(rx, ry, r, 0, Math.PI*2); bCtx.fill();
            
            bCtx.strokeStyle = '#ffffff';
            bCtx.lineWidth = 1;
            bCtx.beginPath(); bCtx.arc(rx, ry, r, 0, Math.PI*2); bCtx.stroke();
        }
    }
    
    return {
        map: new THREE.CanvasTexture(canvas),
        bumpMap: new THREE.CanvasTexture(bCanvas)
    };
}

export function generateEarthTextures() {
    const size = 1024;
    const dCanvas = document.createElement('canvas'); // Diffuse
    const sCanvas = document.createElement('canvas'); // Specular
    const bCanvas = document.createElement('canvas'); // Bump
    
    dCanvas.width = sCanvas.width = bCanvas.width = size;
    dCanvas.height = sCanvas.height = bCanvas.height = size / 2;
    
    const dCtx = dCanvas.getContext('2d');
    const sCtx = sCanvas.getContext('2d');
    const bCtx = bCanvas.getContext('2d');
    
    // Oceans
    dCtx.fillStyle = '#0a213a'; dCtx.fillRect(0, 0, size, size/2);
    sCtx.fillStyle = '#ffffff'; sCtx.fillRect(0, 0, size, size/2);
    bCtx.fillStyle = '#7f7f7f'; bCtx.fillRect(0, 0, size, size/2);
    
    // Continents
    const drawContinent = (x, y, r) => {
        dCtx.fillStyle = '#223c1d';
        dCtx.beginPath(); dCtx.arc(x, y, r, 0, Math.PI*2); dCtx.fill();
        dCtx.fillStyle = '#4b3e2b';
        dCtx.beginPath(); dCtx.arc(x + r*0.2, y - r*0.1, r*0.5, 0, Math.PI*2); dCtx.fill();
        
        sCtx.fillStyle = '#000000';
        sCtx.beginPath(); sCtx.arc(x, y, r, 0, Math.PI*2); sCtx.fill();
        
        bCtx.fillStyle = '#b5b5b5';
        bCtx.beginPath(); bCtx.arc(x, y, r, 0, Math.PI*2); bCtx.fill();
    };
    
    drawContinent(200, 220, 96);
    drawContinent(280, 260, 76);
    drawContinent(360, 220, 116);
    drawContinent(240, 360, 56);
    drawContinent(720, 200, 88);
    drawContinent(760, 340, 76);
    drawContinent(680, 160, 64);
    drawContinent(520, 360, 44);
    
    // Polar Ice Caps
    dCtx.fillStyle = '#ffffff'; dCtx.fillRect(0, 0, size, 44); dCtx.fillRect(0, size/2 - 40, size, 40);
    sCtx.fillStyle = '#3a3a3a'; sCtx.fillRect(0, 0, size, 44); sCtx.fillRect(0, size/2 - 40, size, 40);
    bCtx.fillStyle = '#c8c8c8'; bCtx.fillRect(0, 0, size, 44); bCtx.fillRect(0, size/2 - 40, size, 40);
    
    // Add bump map noise
    const bImg = bCtx.getImageData(0, 0, size, size/2);
    const bData = bImg.data;
    for (let i = 0; i < bData.length; i += 4) {
        if (bData[i] > 127) {
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

export function generateSaturnRingTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, 'rgba(168, 142, 107, 0.0)');
    grad.addColorStop(0.2, 'rgba(195, 175, 145, 0.9)');
    grad.addColorStop(0.5, 'rgba(120, 110, 95, 0.1)');
    grad.addColorStop(0.65, 'rgba(180, 160, 130, 0.85)');
    grad.addColorStop(0.85, 'rgba(150, 130, 100, 0.5)');
    grad.addColorStop(1.0, 'rgba(168, 142, 107, 0.0)');
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 16);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}
