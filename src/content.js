// Page Destroyer - Content Script
// Turn any webpage into a destructible playground!

(function () {
  'use strict';

  console.log('Page Destroyer: Content script loaded');

  // Check if already active - if so, just update weapon
  if (window.pageDestroyerInstance) {
    console.log('Page Destroyer: Already active, updating weapon');
    if (window.pageDestroyerWeapon) {
      window.pageDestroyerInstance.selectWeapon(window.pageDestroyerWeapon);
    }
    return;
  }

  // State
  let currentWeapon = window.pageDestroyerWeapon || 'meteor';
  let isActive = false;
  let isMuted = false;
  let particlesContainer = null;
  let toolbar = null;
  let audioContext = null;
  let destroyedElements = []; // Track destroyed elements for restoration

  // SVG Icons for mute button only
  const svgIcons = {
    mute: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`,
    mutedIcon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`
  };

  // Weapon configurations
  const weapons = {
    flamer: {
      icon: '🔥',
      name: 'Flamer',
      animationClass: 'pd-burning',
      duration: 1200,
      particles: 'fire'
    },
    laser: {
      icon: '⚡',
      name: 'Laser',
      animationClass: 'pd-vaporizing',
      duration: 800,
      particles: 'spark'
    },
    machinegun: {
      icon: '🔫',
      name: 'Machine Gun',
      animationClass: 'pd-shattering',
      duration: 600,
      particles: 'bullet'
    },
    hammer: {
      icon: '🔨',
      name: 'Hammer',
      animationClass: 'pd-smashing',
      duration: 500,
      particles: 'debris'
    },
    meteor: {
      icon: '☄️',
      name: 'Meteor',
      animationClass: 'pd-meteor-hit',
      duration: 1000,
      particles: 'meteor'
    },
    blackhole: {
      icon: '🌀',
      name: 'Black Hole',
      animationClass: 'pd-blackholed',
      duration: 1500,
      particles: 'none'
    },
    explosion: {
      icon: '💥',
      name: 'Explosion',
      animationClass: 'pd-exploding',
      duration: 700,
      particles: 'explosion'
    },
    acid: {
      icon: '🧪',
      name: 'Acid',
      animationClass: 'pd-dissolving',
      duration: 1500,
      particles: 'acid'
    },
    freeze: {
      icon: '🧊',
      name: 'Freeze',
      animationClass: 'pd-freezing',
      duration: 1200,
      particles: 'ice'
    },
    lightning: {
      icon: '⛈️',
      name: 'Lightning',
      animationClass: 'pd-electrified',
      duration: 800,
      particles: 'lightning'
    },
    tornado: {
      icon: '🌪️',
      name: 'Tornado',
      animationClass: 'pd-tornado',
      duration: 1500,
      particles: 'wind'
    },
    pixelate: {
      icon: '👾',
      name: 'Glitch',
      animationClass: 'pd-glitching',
      duration: 1000,
      particles: 'pixels'
    },
    gravity: {
      icon: '🕳️',
      name: 'Gravity',
      animationClass: 'pd-crushed',
      duration: 1000,
      particles: 'gravity'
    }
  };

  // Initialize audio context
  function initAudio() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
  }

  // Play sound based on weapon type
  function playWeaponSound(weaponKey) {
    if (isMuted) return;

    try {
      const ctx = initAudio();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      switch (weaponKey) {
        case 'flamer':
          // Whoosh fire sound
          playNoise(ctx, now, 0.4, 0.3, 'lowpass', 800);
          playTone(ctx, now, 150, 0.15, 0.3, 'sawtooth');
          break;

        case 'laser':
          // Zap sound
          playTone(ctx, now, 1200, 0.1, 0.15, 'sine', 400);
          playTone(ctx, now + 0.05, 800, 0.08, 0.1, 'square');
          break;

        case 'machinegun':
          // Rapid fire
          for (let i = 0; i < 4; i++) {
            playNoise(ctx, now + i * 0.08, 0.08, 0.2, 'highpass', 1000);
          }
          break;

        case 'hammer':
          // Heavy thud
          playTone(ctx, now, 80, 0.15, 0.4, 'sine');
          playNoise(ctx, now, 0.1, 0.3, 'lowpass', 400);
          break;

        case 'meteor':
          // Whoosh then impact
          playNoise(ctx, now, 0.3, 0.2, 'bandpass', 600);
          playTone(ctx, now + 0.45, 60, 0.2, 0.5, 'sine');
          playNoise(ctx, now + 0.45, 0.3, 0.4, 'lowpass', 300);
          break;

        case 'blackhole':
          // Deep suction sound
          playTone(ctx, now, 100, 0.5, 0.3, 'sine', 20);
          playTone(ctx, now, 50, 0.8, 0.2, 'triangle');
          break;

        case 'explosion':
          // Big boom
          playNoise(ctx, now, 0.5, 0.5, 'lowpass', 500);
          playTone(ctx, now, 60, 0.3, 0.4, 'sine');
          playTone(ctx, now + 0.1, 40, 0.4, 0.3, 'triangle');
          break;

        case 'acid':
          // Sizzle/dissolve
          playNoise(ctx, now, 0.5, 0.2, 'highpass', 3000);
          playTone(ctx, now, 300, 0.3, 0.1, 'sawtooth', 100);
          break;

        case 'freeze':
          // Crystalline freeze sound
          playTone(ctx, now, 2000, 0.1, 0.15, 'sine', 3000);
          playTone(ctx, now + 0.1, 1500, 0.15, 0.1, 'sine', 2500);
          playNoise(ctx, now + 0.2, 0.4, 0.15, 'highpass', 4000);
          playTone(ctx, now + 0.3, 800, 0.2, 0.08, 'triangle');
          break;

        case 'lightning':
          // Electric crackle
          playNoise(ctx, now, 0.1, 0.4, 'highpass', 2000);
          playTone(ctx, now, 200, 0.05, 0.3, 'sawtooth', 2000);
          playNoise(ctx, now + 0.1, 0.15, 0.3, 'bandpass', 3000);
          playTone(ctx, now + 0.15, 100, 0.1, 0.2, 'square', 50);
          break;

        case 'tornado':
          // Whooshing wind
          playNoise(ctx, now, 0.8, 0.25, 'bandpass', 400);
          playTone(ctx, now, 200, 0.6, 0.1, 'sine', 100);
          playNoise(ctx, now + 0.3, 0.5, 0.2, 'lowpass', 600);
          break;

        case 'pixelate':
          // Digital glitch
          for (let i = 0; i < 6; i++) {
            playTone(ctx, now + i * 0.1, 100 + Math.random() * 1000, 0.05, 0.15, 'square');
          }
          playNoise(ctx, now, 0.3, 0.2, 'highpass', 5000);
          break;

        case 'gravity':
          // Deep crushing rumble
          playTone(ctx, now, 40, 0.5, 0.4, 'sine', 20);
          playTone(ctx, now, 80, 0.4, 0.25, 'triangle', 30);
          playNoise(ctx, now + 0.2, 0.3, 0.3, 'lowpass', 200);
          break;
      }
    } catch (e) {
      console.log('Page Destroyer: Audio error', e);
    }
  }

  // Play a tone with optional frequency slide
  function playTone(ctx, startTime, freq, duration, volume, type, endFreq) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    if (endFreq) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);
    }

    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  // Play filtered noise
  function playNoise(ctx, startTime, duration, volume, filterType, filterFreq) {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, startTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(startTime);
  }

  // Create particles container
  function createParticlesContainer() {
    if (particlesContainer) return;
    particlesContainer = document.createElement('div');
    particlesContainer.className = 'pd-particles-container';
    particlesContainer.id = 'pd-particles-container';
    document.body.appendChild(particlesContainer);
    console.log('Page Destroyer: Particles container created');
  }

  // Create toolbar (Minecraft-style at bottom center)
  function createToolbar() {
    if (toolbar) return;

    toolbar = document.createElement('div');
    toolbar.className = 'pd-toolbar';
    toolbar.id = 'pd-toolbar';

    Object.entries(weapons).forEach(([key, weapon]) => {
      const btn = document.createElement('button');
      btn.className = 'pd-weapon-btn' + (key === currentWeapon ? ' pd-active' : '');
      btn.dataset.weapon = key;
      btn.dataset.name = weapon.name;
      btn.textContent = weapon.icon;
      btn.title = weapon.name;

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectWeapon(key);
      });

      toolbar.appendChild(btn);
    });

    // Separator
    const separator = document.createElement('div');
    separator.className = 'pd-toolbar-separator';
    toolbar.appendChild(separator);

    // Mute button (SVG icon)
    const muteBtn = document.createElement('button');
    muteBtn.className = 'pd-mute-btn';
    muteBtn.id = 'pd-mute-btn';
    muteBtn.innerHTML = svgIcons.mute;
    muteBtn.title = 'Toggle Sound (M)';
    muteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isMuted = !isMuted;
      muteBtn.innerHTML = isMuted ? svgIcons.mutedIcon : svgIcons.mute;
      muteBtn.classList.toggle('pd-muted', isMuted);
    });
    toolbar.appendChild(muteBtn);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'pd-close-btn';
    closeBtn.textContent = '✕';
    closeBtn.title = 'Exit (ESC)';
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      deactivate();
    });
    toolbar.appendChild(closeBtn);

    document.body.appendChild(toolbar);
    console.log('Page Destroyer: Toolbar created');
  }

  // Select weapon
  function selectWeapon(weaponKey) {
    currentWeapon = weaponKey;
    console.log('Page Destroyer: Weapon selected:', weaponKey);

    // Update toolbar buttons
    document.querySelectorAll('.pd-weapon-btn').forEach(btn => {
      btn.classList.toggle('pd-active', btn.dataset.weapon === weaponKey);
    });

    // Update cursor
    document.body.className = document.body.className.replace(/pd-cursor-\w+/g, '');
    document.body.classList.add(`pd-cursor-${weaponKey}`);
  }

  // Create fire particles
  function createFireParticles(x, y) {
    if (!particlesContainer) return;

    for (let i = 0; i < 15; i++) {
      const particle = document.createElement('div');
      particle.className = 'pd-fire-particle';
      particle.style.left = (x + (Math.random() - 0.5) * 60) + 'px';
      particle.style.top = (y + (Math.random() - 0.5) * 60) + 'px';
      particle.style.width = (10 + Math.random() * 20) + 'px';
      particle.style.height = particle.style.width;
      particle.style.animationDuration = (0.5 + Math.random() * 0.5) + 's';
      particlesContainer.appendChild(particle);
      setTimeout(() => particle.remove(), 1000);
    }

    // Add smoke
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        if (!particlesContainer) return;
        const smoke = document.createElement('div');
        smoke.className = 'pd-smoke';
        smoke.style.left = (x + (Math.random() - 0.5) * 40) + 'px';
        smoke.style.top = y + 'px';
        particlesContainer.appendChild(smoke);
        setTimeout(() => smoke.remove(), 2000);
      }, i * 100);
    }
  }

  // Create spark particles
  function createSparkParticles(x, y) {
    if (!particlesContainer) return;

    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'pd-spark-particle';
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 100;
      const endX = x + Math.cos(angle) * distance;
      const endY = y + Math.sin(angle) * distance;

      particle.style.left = x + 'px';
      particle.style.top = y + 'px';
      particle.animate([
        { left: x + 'px', top: y + 'px', opacity: 1 },
        { left: endX + 'px', top: endY + 'px', opacity: 0 }
      ], {
        duration: 300 + Math.random() * 200,
        easing: 'ease-out'
      });

      particlesContainer.appendChild(particle);
      setTimeout(() => particle.remove(), 500);
    }

    // Laser beam effect
    const beam = document.createElement('div');
    beam.className = 'pd-laser-beam';
    beam.style.left = '0';
    beam.style.top = y + 'px';
    beam.style.width = x + 'px';
    particlesContainer.appendChild(beam);
    setTimeout(() => beam.remove(), 300);
  }

  // Create bullet particles
  function createBulletParticles(x, y) {
    if (!particlesContainer) return;

    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        if (!particlesContainer) return;
        const hole = document.createElement('div');
        hole.className = 'pd-bullet-hole';
        hole.style.left = (x + (Math.random() - 0.5) * 50) + 'px';
        hole.style.top = (y + (Math.random() - 0.5) * 50) + 'px';
        particlesContainer.appendChild(hole);
        setTimeout(() => hole.remove(), 2000);

        // Sparks
        for (let j = 0; j < 3; j++) {
          const spark = document.createElement('div');
          spark.className = 'pd-spark-particle';
          spark.style.left = hole.style.left;
          spark.style.top = hole.style.top;
          spark.style.background = '#ffaa00';
          const angle = Math.random() * Math.PI * 2;
          const dist = 20 + Math.random() * 30;
          spark.animate([
            { transform: 'translate(0, 0)', opacity: 1 },
            { transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`, opacity: 0 }
          ], { duration: 200 });
          particlesContainer.appendChild(spark);
          setTimeout(() => spark.remove(), 200);
        }
      }, i * 50);
    }
  }

  // Create debris particles
  function createDebrisParticles(x, y, rect) {
    if (!particlesContainer) return;

    const colors = ['#666', '#888', '#444', '#555'];
    for (let i = 0; i < 12; i++) {
      const debris = document.createElement('div');
      debris.className = 'pd-debris';
      debris.style.left = (x + (Math.random() - 0.5) * (rect?.width || 100)) + 'px';
      debris.style.top = (y + (Math.random() - 0.5) * (rect?.height || 50)) + 'px';
      debris.style.width = (5 + Math.random() * 15) + 'px';
      debris.style.height = (5 + Math.random() * 15) + 'px';
      debris.style.background = colors[Math.floor(Math.random() * colors.length)];
      debris.style.transform = `rotate(${Math.random() * 360}deg)`;

      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
      const distance = 50 + Math.random() * 150;
      const endX = parseFloat(debris.style.left) + Math.cos(angle) * distance * (Math.random() > 0.5 ? 1 : -1);
      const endY = parseFloat(debris.style.top) + Math.sin(angle) * distance + 200;

      debris.animate([
        { transform: `translateY(0) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${endX - parseFloat(debris.style.left)}px, ${endY - parseFloat(debris.style.top)}px) rotate(${720 * (Math.random() > 0.5 ? 1 : -1)}deg)`, opacity: 0 }
      ], {
        duration: 800 + Math.random() * 400,
        easing: 'ease-in'
      });

      particlesContainer.appendChild(debris);
      setTimeout(() => debris.remove(), 1200);
    }

    // Impact shockwave
    const shockwave = document.createElement('div');
    shockwave.className = 'pd-shockwave';
    shockwave.style.left = x + 'px';
    shockwave.style.top = y + 'px';
    particlesContainer.appendChild(shockwave);
    setTimeout(() => shockwave.remove(), 500);
  }

  // Create meteor effect
  function createMeteorEffect(x, y) {
    if (!particlesContainer) return;

    const meteor = document.createElement('div');
    meteor.className = 'pd-meteor';

    // Start from top of screen
    const startX = x - 200;
    const startY = -100;

    meteor.style.left = startX + 'px';
    meteor.style.top = startY + 'px';

    particlesContainer.appendChild(meteor);

    meteor.animate([
      { left: startX + 'px', top: startY + 'px', transform: 'scale(0.5)' },
      { left: (x - 30) + 'px', top: (y - 30) + 'px', transform: 'scale(1)' }
    ], {
      duration: 500,
      easing: 'ease-in',
      fill: 'forwards'
    });

    setTimeout(() => {
      meteor.remove();

      // Flash
      const flash = document.createElement('div');
      flash.className = 'pd-flash';
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 300);

      // Shockwave
      if (particlesContainer) {
        const shockwave = document.createElement('div');
        shockwave.className = 'pd-shockwave';
        shockwave.style.left = x + 'px';
        shockwave.style.top = y + 'px';
        shockwave.style.borderColor = '#ff6600';
        shockwave.style.borderWidth = '5px';
        particlesContainer.appendChild(shockwave);
        setTimeout(() => shockwave.remove(), 500);
      }

      // Fire and debris
      createFireParticles(x, y);
      createDebrisParticles(x, y, { width: 150, height: 100 });
    }, 500);
  }

  // Create explosion effect
  function createExplosionEffect(x, y) {
    // Flash
    const flash = document.createElement('div');
    flash.className = 'pd-flash';
    flash.style.background = '#ff6600';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 300);

    if (!particlesContainer) return;

    // Multiple shockwaves
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        if (!particlesContainer) return;
        const shockwave = document.createElement('div');
        shockwave.className = 'pd-shockwave';
        shockwave.style.left = x + 'px';
        shockwave.style.top = y + 'px';
        shockwave.style.borderColor = `hsl(${30 - i * 10}, 100%, 50%)`;
        particlesContainer.appendChild(shockwave);
        setTimeout(() => shockwave.remove(), 500);
      }, i * 100);
    }

    // Fire
    createFireParticles(x, y);
    createDebrisParticles(x, y, { width: 200, height: 150 });
  }

  // Create acid effect
  function createAcidEffect(x, y) {
    if (!particlesContainer) return;

    for (let i = 0; i < 10; i++) {
      const drop = document.createElement('div');
      drop.className = 'pd-fire-particle';
      drop.style.background = 'radial-gradient(circle, #00ff00 0%, #008800 50%, transparent 100%)';
      drop.style.left = (x + (Math.random() - 0.5) * 80) + 'px';
      drop.style.top = (y + (Math.random() - 0.5) * 80) + 'px';
      drop.style.width = (15 + Math.random() * 15) + 'px';
      drop.style.height = drop.style.width;
      drop.style.boxShadow = '0 0 10px #00ff00';
      particlesContainer.appendChild(drop);
      setTimeout(() => drop.remove(), 1000);
    }

    // Bubbles
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        if (!particlesContainer) return;
        const bubble = document.createElement('div');
        bubble.className = 'pd-spark-particle';
        bubble.style.background = '#00ff00';
        bubble.style.boxShadow = '0 0 5px #00ff00';
        bubble.style.left = (x + (Math.random() - 0.5) * 60) + 'px';
        bubble.style.top = (y + (Math.random() - 0.5) * 60) + 'px';
        bubble.style.width = (3 + Math.random() * 6) + 'px';
        bubble.style.height = bubble.style.width;
        bubble.style.borderRadius = '50%';

        bubble.animate([
          { transform: 'translateY(0) scale(1)', opacity: 1 },
          { transform: 'translateY(-50px) scale(0)', opacity: 0 }
        ], { duration: 500 + Math.random() * 500 });

        particlesContainer.appendChild(bubble);
        setTimeout(() => bubble.remove(), 1000);
      }, i * 50);
    }
  }

  // Create ice/freeze effect
  function createIceEffect(x, y) {
    if (!particlesContainer) return;

    // Ice crystals
    for (let i = 0; i < 15; i++) {
      const crystal = document.createElement('div');
      crystal.className = 'pd-ice-crystal';
      const angle = (i / 15) * Math.PI * 2;
      const distance = 30 + Math.random() * 50;
      crystal.style.left = (x + Math.cos(angle) * distance) + 'px';
      crystal.style.top = (y + Math.sin(angle) * distance) + 'px';
      crystal.style.transform = `rotate(${Math.random() * 360}deg)`;
      particlesContainer.appendChild(crystal);
      setTimeout(() => crystal.remove(), 1500);
    }

    // Frost ring
    const frostRing = document.createElement('div');
    frostRing.className = 'pd-frost-ring';
    frostRing.style.left = x + 'px';
    frostRing.style.top = y + 'px';
    particlesContainer.appendChild(frostRing);
    setTimeout(() => frostRing.remove(), 800);

    // Sparkle particles
    for (let i = 0; i < 20; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'pd-ice-sparkle';
      sparkle.style.left = (x + (Math.random() - 0.5) * 100) + 'px';
      sparkle.style.top = (y + (Math.random() - 0.5) * 100) + 'px';
      sparkle.style.animationDelay = (Math.random() * 0.5) + 's';
      particlesContainer.appendChild(sparkle);
      setTimeout(() => sparkle.remove(), 1200);
    }
  }

  // Create lightning effect
  function createLightningEffect(x, y) {
    if (!particlesContainer) return;

    // Flash
    const flash = document.createElement('div');
    flash.className = 'pd-flash';
    flash.style.background = '#ffffff';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 100);

    // Multiple lightning bolts
    for (let b = 0; b < 3; b++) {
      setTimeout(() => {
        if (!particlesContainer) return;
        const bolt = document.createElement('div');
        bolt.className = 'pd-lightning-bolt';
        bolt.style.left = (x + (Math.random() - 0.5) * 60) + 'px';
        bolt.style.top = (y - 200) + 'px';

        // Create zigzag path using SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '60');
        svg.setAttribute('height', '220');
        svg.style.position = 'absolute';
        svg.style.overflow = 'visible';

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let d = 'M30,0';
        let currentX = 30, currentY = 0;
        for (let i = 0; i < 8; i++) {
          currentX += (Math.random() - 0.5) * 40;
          currentY += 25 + Math.random() * 10;
          d += ` L${currentX},${currentY}`;
        }
        path.setAttribute('d', d);
        path.setAttribute('stroke', '#ffffff');
        path.setAttribute('stroke-width', '3');
        path.setAttribute('fill', 'none');
        path.setAttribute('filter', 'drop-shadow(0 0 10px #00aaff) drop-shadow(0 0 20px #0066ff)');
        svg.appendChild(path);
        bolt.appendChild(svg);

        particlesContainer.appendChild(bolt);
        setTimeout(() => bolt.remove(), 300);
      }, b * 100);
    }

    // Electric sparks
    for (let i = 0; i < 25; i++) {
      const spark = document.createElement('div');
      spark.className = 'pd-electric-spark';
      const angle = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 80;
      spark.style.left = x + 'px';
      spark.style.top = y + 'px';

      spark.animate([
        { left: x + 'px', top: y + 'px', opacity: 1 },
        { left: (x + Math.cos(angle) * dist) + 'px', top: (y + Math.sin(angle) * dist) + 'px', opacity: 0 }
      ], { duration: 200 + Math.random() * 200 });

      particlesContainer.appendChild(spark);
      setTimeout(() => spark.remove(), 400);
    }
  }

  // Create tornado/wind effect
  function createWindEffect(x, y) {
    if (!particlesContainer) return;

    // Create vortex ring particles
    for (let ring = 0; ring < 5; ring++) {
      setTimeout(() => {
        if (!particlesContainer) return;
        for (let i = 0; i < 8; i++) {
          const particle = document.createElement('div');
          particle.className = 'pd-wind-particle';
          const angle = (i / 8) * Math.PI * 2;
          const radius = 30 + ring * 20;
          particle.style.left = (x + Math.cos(angle) * radius) + 'px';
          particle.style.top = (y + Math.sin(angle) * radius - ring * 30) + 'px';

          particle.animate([
            { transform: 'rotate(0deg) scale(1)', opacity: 0.8 },
            { transform: 'rotate(720deg) scale(0)', opacity: 0 }
          ], { duration: 1000 + ring * 200, easing: 'ease-in' });

          particlesContainer.appendChild(particle);
          setTimeout(() => particle.remove(), 1200 + ring * 200);
        }
      }, ring * 100);
    }

    // Debris caught in wind
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        if (!particlesContainer) return;
        const debris = document.createElement('div');
        debris.className = 'pd-tornado-debris';
        debris.style.left = (x + (Math.random() - 0.5) * 100) + 'px';
        debris.style.top = (y + (Math.random() - 0.5) * 60) + 'px';
        debris.style.width = (5 + Math.random() * 10) + 'px';
        debris.style.height = (5 + Math.random() * 10) + 'px';

        const endAngle = Math.random() * Math.PI * 2;
        const endDist = 100 + Math.random() * 150;

        debris.animate([
          { transform: 'rotate(0deg)', opacity: 1 },
          { transform: `translate(${Math.cos(endAngle) * endDist}px, ${-endDist + Math.sin(endAngle) * 50}px) rotate(${1080 * (Math.random() > 0.5 ? 1 : -1)}deg)`, opacity: 0 }
        ], { duration: 1200 + Math.random() * 500, easing: 'ease-out' });

        particlesContainer.appendChild(debris);
        setTimeout(() => debris.remove(), 1700);
      }, i * 50);
    }

    // Central vortex
    const vortex = document.createElement('div');
    vortex.className = 'pd-vortex';
    vortex.style.left = x + 'px';
    vortex.style.top = y + 'px';
    particlesContainer.appendChild(vortex);
    setTimeout(() => vortex.remove(), 1500);
  }

  // Create pixel/glitch effect
  function createPixelEffect(x, y) {
    if (!particlesContainer) return;

    // Glitch flash
    const glitchFlash = document.createElement('div');
    glitchFlash.className = 'pd-glitch-flash';
    glitchFlash.style.left = (x - 75) + 'px';
    glitchFlash.style.top = (y - 75) + 'px';
    particlesContainer.appendChild(glitchFlash);
    setTimeout(() => glitchFlash.remove(), 500);

    // Pixel particles
    const colors = ['#ff0055', '#00ff88', '#0088ff', '#ffff00', '#ff00ff', '#00ffff'];
    for (let i = 0; i < 40; i++) {
      const pixel = document.createElement('div');
      pixel.className = 'pd-pixel';
      pixel.style.left = (x + (Math.random() - 0.5) * 80) + 'px';
      pixel.style.top = (y + (Math.random() - 0.5) * 80) + 'px';
      pixel.style.background = colors[Math.floor(Math.random() * colors.length)];
      pixel.style.width = (4 + Math.random() * 8) + 'px';
      pixel.style.height = pixel.style.width;

      const angle = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * 100;

      pixel.animate([
        { transform: 'scale(1)', opacity: 1 },
        { transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(0)`, opacity: 0 }
      ], { duration: 500 + Math.random() * 500, easing: 'steps(5)' });

      particlesContainer.appendChild(pixel);
      setTimeout(() => pixel.remove(), 1000);
    }

    // Scanline effect
    for (let i = 0; i < 5; i++) {
      const scanline = document.createElement('div');
      scanline.className = 'pd-scanline';
      scanline.style.left = (x - 100) + 'px';
      scanline.style.top = (y - 50 + i * 25) + 'px';
      scanline.style.animationDelay = (i * 0.1) + 's';
      particlesContainer.appendChild(scanline);
      setTimeout(() => scanline.remove(), 600);
    }
  }

  // Create gravity crush effect
  function createGravityEffect(x, y) {
    if (!particlesContainer) return;

    // Gravity well visual
    const well = document.createElement('div');
    well.className = 'pd-gravity-well';
    well.style.left = x + 'px';
    well.style.top = y + 'px';
    particlesContainer.appendChild(well);
    setTimeout(() => well.remove(), 1000);

    // Particles being sucked in
    for (let i = 0; i < 30; i++) {
      const particle = document.createElement('div');
      particle.className = 'pd-gravity-particle';
      const angle = Math.random() * Math.PI * 2;
      const startDist = 80 + Math.random() * 120;
      const startX = x + Math.cos(angle) * startDist;
      const startY = y + Math.sin(angle) * startDist;

      particle.style.left = startX + 'px';
      particle.style.top = startY + 'px';
      particle.style.width = (3 + Math.random() * 6) + 'px';
      particle.style.height = particle.style.width;

      particle.animate([
        { left: startX + 'px', top: startY + 'px', opacity: 0.8, transform: 'scale(1)' },
        { left: x + 'px', top: y + 'px', opacity: 0, transform: 'scale(0)' }
      ], { duration: 600 + Math.random() * 400, easing: 'ease-in' });

      particlesContainer.appendChild(particle);
      setTimeout(() => particle.remove(), 1000);
    }

    // Ground crack effect
    for (let i = 0; i < 6; i++) {
      const crack = document.createElement('div');
      crack.className = 'pd-gravity-crack';
      const angle = (i / 6) * Math.PI * 2;
      crack.style.left = x + 'px';
      crack.style.top = y + 'px';
      crack.style.transform = `rotate(${angle}rad)`;
      particlesContainer.appendChild(crack);
      setTimeout(() => crack.remove(), 1000);
    }
  }

  // Create particles based on weapon type
  function createParticles(weaponKey, x, y, rect) {
    const weapon = weapons[weaponKey];
    switch (weapon.particles) {
      case 'fire':
        createFireParticles(x, y);
        break;
      case 'spark':
        createSparkParticles(x, y);
        break;
      case 'bullet':
        createBulletParticles(x, y);
        break;
      case 'debris':
        createDebrisParticles(x, y, rect);
        break;
      case 'meteor':
        createMeteorEffect(x, y);
        break;
      case 'explosion':
        createExplosionEffect(x, y);
        break;
      case 'acid':
        createAcidEffect(x, y);
        break;
      case 'ice':
        createIceEffect(x, y);
        break;
      case 'lightning':
        createLightningEffect(x, y);
        break;
      case 'wind':
        createWindEffect(x, y);
        break;
      case 'pixels':
        createPixelEffect(x, y);
        break;
      case 'gravity':
        createGravityEffect(x, y);
        break;
    }
  }

  // Create ruins where element was destroyed
  function createRuins(rect) {
    if (!particlesContainer) return;

    const numRuins = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numRuins; i++) {
      const ruin = document.createElement('div');
      ruin.className = 'pd-ruins';
      ruin.style.position = 'fixed';
      ruin.style.left = (rect.left + Math.random() * rect.width * 0.8) + 'px';
      ruin.style.top = (rect.top + Math.random() * rect.height * 0.8) + 'px';
      ruin.style.width = (10 + Math.random() * 30) + 'px';
      ruin.style.height = (5 + Math.random() * 15) + 'px';
      ruin.style.transform = `rotate(${Math.random() * 30 - 15}deg)`;
      particlesContainer.appendChild(ruin);
    }
  }

  // Check if element is part of our UI
  function isOurUI(element) {
    return element.closest('#pd-toolbar') ||
      element.closest('#pd-particles-container') ||
      element.closest('.pd-toolbar') ||
      element.closest('.pd-particles-container');
  }

  // Check if element is too large (would destroy too much of the page)
  function isTooLarge(element) {
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Skip if element covers more than 50% of viewport width AND height
    const coversWidth = rect.width > viewportWidth * 0.5;
    const coversHeight = rect.height > viewportHeight * 0.5;

    // Also skip if element is larger than 800x600 pixels
    const isMassive = rect.width > 800 && rect.height > 600;

    return (coversWidth && coversHeight) || isMassive;
  }

  // Destroy element
  function destroyElement(element, event) {
    if (!element || element.classList.contains('pd-destroyed') || isOurUI(element)) {
      return;
    }

    // Skip large container elements to prevent destroying the whole page
    if (isTooLarge(element)) {
      console.log('Page Destroyer: Skipping large container:', element.tagName, element.className);
      return;
    }

    console.log('Page Destroyer: Destroying element:', element.tagName, element.className);

    const weapon = weapons[currentWeapon];
    const rect = element.getBoundingClientRect();
    const centerX = event?.clientX || (rect.left + rect.width / 2);
    const centerY = event?.clientY || (rect.top + rect.height / 2);

    // Play weapon sound
    playWeaponSound(currentWeapon);

    // Track element for restoration
    destroyedElements.push({
      element,
      originalVisibility: element.style.visibility,
      originalPointerEvents: element.style.pointerEvents,
      animationClass: weapon.animationClass
    });

    // Add destruction class
    element.classList.add('pd-destroyed');
    element.classList.add(weapon.animationClass);

    // Create particles
    createParticles(currentWeapon, centerX, centerY, rect);

    // Remove element after animation
    setTimeout(() => {
      // Create ruins
      createRuins(rect);

      // Hide element
      element.style.visibility = 'hidden';
      element.style.pointerEvents = 'none';
    }, weapon.duration);
  }

  // Handle click on destructible elements
  function handleClick(event) {
    if (!isActive) return;

    const target = event.target;

    // Ignore UI elements
    if (isOurUI(target)) {
      return;
    }

    console.log('Page Destroyer: Click detected on:', target.tagName);

    event.preventDefault();
    event.stopPropagation();

    destroyElement(target, event);
  }

  // Make all elements targetable
  function makeElementsTargetable() {
    const selectors = 'div, p, span, a, img, button, input, h1, h2, h3, h4, h5, h6, li, article, section, header, footer, nav, aside, main, form, table, tr, td, th, ul, ol, figure, figcaption, blockquote, pre, code, label, video, iframe, canvas, svg';
    const elementsToTarget = document.querySelectorAll(selectors);

    console.log('Page Destroyer: Making', elementsToTarget.length, 'elements targetable');

    elementsToTarget.forEach(el => {
      if (!isOurUI(el)) {
        el.classList.add('pd-targetable');
      }
    });
  }

  // Remove targetable class
  function removeTargetableClass() {
    document.querySelectorAll('.pd-targetable').forEach(el => {
      el.classList.remove('pd-targetable');
    });
  }

  // Handle keyboard events
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      deactivate();
      return;
    }

    // Number keys for weapon selection
    const weaponKeys = Object.keys(weapons);
    const num = parseInt(event.key);
    if (num >= 1 && num <= weaponKeys.length) {
      selectWeapon(weaponKeys[num - 1]);
    }

    // M key for mute toggle
    if (event.key === 'm' || event.key === 'M') {
      const muteBtn = document.getElementById('pd-mute-btn');
      if (muteBtn) {
        isMuted = !isMuted;
        muteBtn.textContent = isMuted ? '🔇' : '🔊';
        muteBtn.classList.toggle('pd-muted', isMuted);
      }
    }
  }

  // Activate destruction mode
  function activate(weapon) {
    if (isActive) {
      console.log('Page Destroyer: Already active');
      return;
    }

    console.log('Page Destroyer: Activating with weapon:', weapon);
    isActive = true;

    if (weapon) {
      currentWeapon = weapon;
    }

    createParticlesContainer();
    createToolbar();
    makeElementsTargetable();

    // Set cursor
    document.body.classList.add(`pd-cursor-${currentWeapon}`);

    // Add event listeners with capture to get events first
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeydown, true);

    // Select initial weapon in toolbar
    selectWeapon(currentWeapon);

    console.log('Page Destroyer: Activation complete!');
  }

  // Deactivate destruction mode
  function deactivate() {
    if (!isActive) return;

    console.log('Page Destroyer: Deactivating');
    isActive = false;

    // Restore all destroyed elements
    destroyedElements.forEach(({ element, originalVisibility, originalPointerEvents, animationClass }) => {
      element.classList.remove('pd-destroyed');
      element.classList.remove(animationClass);
      element.style.visibility = originalVisibility || '';
      element.style.pointerEvents = originalPointerEvents || '';
    });
    destroyedElements = [];
    console.log('Page Destroyer: Elements restored');

    // Remove UI elements
    if (toolbar) {
      toolbar.remove();
      toolbar = null;
    }
    if (particlesContainer) {
      particlesContainer.remove();
      particlesContainer = null;
    }

    // Close audio context
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }

    // Remove classes
    removeTargetableClass();
    document.body.className = document.body.className.replace(/pd-cursor-\w+/g, '');

    // Remove event listeners
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('keydown', handleKeydown, true);

    // Clean up
    window.pageDestroyerInstance = null;
    window.pageDestroyerActivate = false;
  }

  // Expose instance for re-activation
  window.pageDestroyerInstance = {
    activate,
    deactivate,
    selectWeapon
  };

  // Auto-activate if flag is set
  if (window.pageDestroyerActivate) {
    console.log('Page Destroyer: Auto-activating...');
    activate(window.pageDestroyerWeapon);
  }

})();
