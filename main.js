/* ==========================================================================
   GELATERIA D'ANTAN RESTYLING - INTERACTIVE JAVASCRIPT
   ========================================================================== */

// --- STATE MANAGEMENT ---
let currentTheme = 'modern';
let activeScoops = []; // Tracks flavor index for [bottom, mid, top]
let canvasAnimId = null;

// --- DYNAMIC FONT REGISTRY ---
const themeFonts = {
  modern: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap',
  futuristic: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Space+Grotesk:wght@300;400;600;700&display=swap',
  retro: 'https://fonts.googleapis.com/css2?family=Italiana&family=Lora:ital,wght@0,400;0,600;1,400&display=swap'
};

const fontLinks = {};

// Load fonts dynamically to keep loading performance high
function loadThemeFonts(theme) {
  if (fontLinks[theme]) return; // Already loaded

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = themeFonts[theme];
  document.head.appendChild(link);
  fontLinks[theme] = link;
}

// --- THEME SWITCHING SYSTEM ---
const themeDetails = {
  modern: {
    title: "Aestetica Editoriale & Minimalista",
    text: "Layout spazioso con contrasti tipografici sofisticati (Serif elegante e Sans-Serif geometrico). Palette colori ispirata a tonalità organiche e terracotta. Micro-interazioni fluide per valorizzare l'artigianalità contemporanea."
  },
  futuristic: {
    title: "Laboratorio Cryo-Gelato (Alchimia del Freddo)",
    text: "Esperienza digitale in Dark Mode. Dettagli HUD (Heads-Up Display), retroilluminazione neon cyan e magenta, e font tech futuristici. Sfondo animato a particelle per rievocare la criogenizzazione del gelato."
  },
  retro: {
    title: "La Dolce Vita (Ambiance Anni '50/'60)",
    text: "Un viaggio nel tempo nella riviera italiana di metà secolo. Tonalità pastello calde (pistacchio, fragola, crema), contorni marcati, ombre piatte e spesse tipiche dei manifesti vintage. Tipografia classica d'epoca."
  }
};

function switchTheme(theme) {
  if (theme === currentTheme && document.body.classList.contains(`theme-${theme}`)) return;

  // Add transition class for page fade effect
  document.body.style.opacity = '0.3';
  
  setTimeout(() => {
    // Load fonts for the new theme
    loadThemeFonts(theme);

    // Update Body class
    document.body.className = '';
    document.body.classList.add(`theme-${theme}`);
    currentTheme = theme;

    // Update buttons state
    document.querySelectorAll('.dock-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-theme-${theme}`);
    if (activeBtn) activeBtn.classList.add('active');

    // Update details text in presenter dock
    const detailsContainer = document.getElementById('theme-details');
    if (detailsContainer) {
      detailsContainer.innerHTML = `
        <span class="theme-desc-title">${themeDetails[theme].title}</span>
        <p class="theme-desc-text">${themeDetails[theme].text}</p>
      `;
    }

    // Toggle Futuristic Particle Canvas
    const canvas = document.getElementById('futuristic-bg');
    if (theme === 'futuristic') {
      canvas.style.display = 'block';
      startParticleAnimation();
    } else {
      canvas.style.display = 'none';
      stopParticleAnimation();
    }

    // Restore opacity with a smooth transition
    document.body.style.transition = 'opacity 0.4s ease';
    document.body.style.opacity = '1';
  }, 200);
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  // Load initial modern fonts
  loadThemeFonts('modern');
  
  // Set initial details
  switchTheme('modern');
  
  // Initialize mobile menu toggle
  setupMobileMenu();

  // Load default gelato scoops
  initGelatoMixer();
});


// --- MOBILE MENU ---
function setupMobileMenu() {
  const toggle = document.getElementById('mobile-menu-toggle');
  const nav = document.getElementById('main-nav');
  
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('active');
      toggle.classList.toggle('active');
    });

    // Close when clicking nav links
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('active');
        toggle.classList.remove('active');
      });
    });
  }
}

// Add CSS rules dynamically for mobile responsive menu if needed
const style = document.createElement('style');
style.textContent = `
  @media (max-width: 768px) {
    .main-nav {
      display: none;
      position: absolute;
      top: var(--header-height);
      left: 0;
      width: 100%;
      background: var(--bg-surface);
      border-bottom: 2px solid var(--primary-color);
      padding: 20px 0;
      box-shadow: var(--shadow-md);
    }
    .main-nav.active {
      display: block;
      animation: fadeInNav 0.3s ease;
    }
    .main-nav ul {
      flex-direction: column;
      gap: 20px;
    }
    .mobile-menu-toggle.active span:nth-child(1) {
      transform: translateY(8px) rotate(45deg);
    }
    .mobile-menu-toggle.active span:nth-child(2) {
      opacity: 0;
    }
    .mobile-menu-toggle.active span:nth-child(3) {
      transform: translateY(-8px) rotate(-45deg);
    }
  }
  @keyframes fadeInNav {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);


// --- INTERACTIVE GELATO MIXER ---
const flavorsConfig = {
  "Fondente d'Antan": { color: "#3c2f2f", desc: "cacao intenso, note calde di rum e scorza d'arancia" },
  "Pistacchio Puro": { color: "#9ab99c", desc: "pistacchio di Bronte tostato a pietra con pizzico di sale di Cervia" },
  "Crema di Nicolò": { color: "#f5e1a4", desc: "crema all'uovo tradizionale aromatizzata con scorza di limone e vaniglia Bourbon" },
  "Fragola di Bosco": { color: "#e68c85", desc: "sorbetto fresco di fragoline di bosco piemontesi, 100% vegan" },
  "Nocciola Piemonte": { color: "#e4d2cc", desc: "nocciola Tonda Gentile Trilobata IGP delle Langhe tostata" }
};

function initGelatoMixer() {
  // Pre-populate with 3 default flavors
  const defaultFlavors = [
    { name: "Pistacchio Puro", color: "#9ab99c" },
    { name: "Nocciola Piemonte", color: "#e4d2cc" },
    { name: "Fondente d'Antan", color: "#3c2f2f" }
  ];
  
  activeScoops = [...defaultFlavors];
  updateMixerVisual();
}

function selectFlavor(btnElement, id) {
  const flavorName = btnElement.getAttribute('data-flavor');
  const color = btnElement.getAttribute('data-color');
  
  // Manage scoop levels (bottom, mid, top) in FIFO order (first-in, first-out)
  if (activeScoops.length >= 3) {
    activeScoops.shift(); // Remove bottom scoop to make space
  }
  
  activeScoops.push({ name: flavorName, color: color });
  
  // Highlight active buttons
  document.querySelectorAll('.flavor-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  activeScoops.forEach(scoop => {
    const activeBtn = document.querySelector(`.flavor-btn[data-flavor="${scoop.name}"]`);
    if (activeBtn) activeBtn.classList.add('active');
  });

  updateMixerVisual();
}

function updateMixerVisual() {
  const scoopBottom = document.getElementById('scoop-1');
  const scoopMid = document.getElementById('scoop-2');
  const scoopTop = document.getElementById('scoop-3');
  const textLabel = document.getElementById('selected-flavors-text');
  
  const elementMap = [scoopBottom, scoopMid, scoopTop];
  
  // Reset all scoop visuals first
  elementMap.forEach(el => {
    if (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-50%) translateY(20px)';
    }
  });

  // Apply active scoop colors and animations
  activeScoops.forEach((scoop, index) => {
    const scoopEl = document.getElementById(`scoop-${index + 1}`);
    if (scoopEl) {
      scoopEl.style.backgroundColor = scoop.color;
      scoopEl.style.color = scoop.color; // Custom property mapping
      
      // Delay scoop drop animation for satisfying visual stack
      setTimeout(() => {
        scoopEl.style.opacity = '1';
        scoopEl.style.transform = 'translateX(-50%) translateY(0)';
      }, index * 150);
    }
  });

  // Compile flavor descriptions
  if (activeScoops.length > 0) {
    const names = activeScoops.map(s => s.name).join(' + ');
    const details = activeScoops.map(s => flavorsConfig[s.name].desc).join(', ');
    textLabel.innerHTML = `${names}<br><span style="font-size: 0.85rem; font-weight: normal; color: var(--text-muted); display: block; margin-top: 8px;">Accostamento: ${details}.</span>`;
  } else {
    textLabel.textContent = "Scegli un gusto per iniziare ad assemblare!";
  }
}

// --- FUTURISTIC CANVAS PARTICLE SYSTEM ---
function startParticleAnimation() {
  const canvas = document.getElementById('futuristic-bg');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  const particles = [];
  const maxParticles = 65;

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.radius = Math.random() * 2 + 1;
      this.color = Math.random() > 0.5 ? '#00f0ff' : '#ff007f';
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = this.color;
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    }
  }

  // Populate particles
  for (let i = 0; i < maxParticles; i++) {
    particles.push(new Particle());
  }

  function handleResize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', handleResize);

  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Draw grid overlay lines
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.02)';
    ctx.lineWidth = 1;
    const gridSize = 80;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Update and draw particles
    particles.forEach(p => {
      p.update();
      p.draw();
    });

    // Draw connection lines
    ctx.lineWidth = 0.5;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          // Set color based on proximity and source colors
          ctx.strokeStyle = `rgba(0, 240, 255, ${1 - dist / 100})`;
          ctx.stroke();
        }
      }
    }

    canvasAnimId = requestAnimationFrame(animate);
  }

  animate();

  // Cleanup reference
  canvas.cleanup = () => {
    window.removeEventListener('resize', handleResize);
  };
}

function stopParticleAnimation() {
  if (canvasAnimId) {
    cancelAnimationFrame(canvasAnimId);
    canvasAnimId = null;
  }
  const canvas = document.getElementById('futuristic-bg');
  if (canvas && canvas.cleanup) {
    canvas.cleanup();
  }
}
