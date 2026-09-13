/* =========================================================
   NAVIGATION: mobile toggle + active link + navbar bg on scroll
   ========================================================= */
const navbar   = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');
const navLinkEls = document.querySelectorAll('.nav-link');
const sections  = document.querySelectorAll('main section[id]');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinkEls.forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

function onScroll(){
  navbar.classList.toggle('scrolled', window.scrollY > 40);

  // active nav link
  let current = sections[0] ? sections[0].id : '';
  const offset = 110;
  sections.forEach(sec => {
    if (window.scrollY + offset >= sec.offsetTop) current = sec.id;
  });
  navLinkEls.forEach(link => {
    link.classList.toggle('active-link', link.getAttribute('href') === `#${current}`);
  });

  // back to top button
  backToTop.classList.toggle('visible', window.scrollY > 500);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* =========================================================
   BACK TO TOP
   ========================================================= */
const backToTop = document.getElementById('backToTop');
backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* =========================================================
   SCROLL REVEAL (Intersection Observer)
   ========================================================= */
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting){
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach(el => revealObserver.observe(el));

/* Skill bar fill, triggered once visible */
const skillCards = document.querySelectorAll('.skill-card');
const skillObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting){
      const fill = entry.target.querySelector('.skill-fill');
      const level = entry.target.dataset.level || 0;
      fill.style.width = `${level}%`;
      skillObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.4 });
skillCards.forEach(card => skillObserver.observe(card));

/* =========================================================
   TYPING ANIMATION (hero role line)
   ========================================================= */
const typingEl = document.getElementById('typingText');
const phrases = [
  'Aspiring Data Analyst',
  'Python Enthusiast',
  'Technology Learner'
];

function typeLoop(){
  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function tick(){
    const current = phrases[phraseIndex];

    if (!deleting){
      charIndex++;
      typingEl.textContent = current.slice(0, charIndex);
      if (charIndex === current.length){
        deleting = true;
        setTimeout(tick, 1400);
        return;
      }
    } else {
      charIndex--;
      typingEl.textContent = current.slice(0, charIndex);
      if (charIndex === 0){
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
      }
    }
    setTimeout(tick, deleting ? 40 : 70);
  }
  tick();
}

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  typeLoop();
} else {
  typingEl.textContent = phrases[0];
}

/* =========================================================
   HERO BACKGROUND: subtle animated node graph (2D canvas)
   Echoes the "relationship mapping" project — nodes + edges drift
   slowly behind the hero content.
   ========================================================= */
(function drawGraphBackground(){
  const canvas = document.getElementById('graphCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width, height, nodes;

  function resize(){
    width = canvas.width = canvas.offsetWidth * devicePixelRatio;
    height = canvas.height = canvas.offsetHeight * devicePixelRatio;
  }

  function makeNodes(){
    const count = Math.max(18, Math.floor((canvas.offsetWidth * canvas.offsetHeight) / 42000));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.15 * devicePixelRatio,
      vy: (Math.random() - 0.5) * 0.15 * devicePixelRatio,
      r: (Math.random() * 1.6 + 1) * devicePixelRatio
    }));
  }

  function frame(){
    ctx.clearRect(0, 0, width, height);
    const linkDist = 150 * devicePixelRatio;

    nodes.forEach(n => {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;
    });

    for (let i = 0; i < nodes.length; i++){
      for (let j = i + 1; j < nodes.length; j++){
        const a = nodes[i], b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < linkDist){
          ctx.strokeStyle = `rgba(94, 231, 255, ${0.18 * (1 - d / linkDist)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    nodes.forEach(n => {
      ctx.fillStyle = 'rgba(139, 123, 255, 0.55)';
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    });

    if (!reduceMotion) requestAnimationFrame(frame);
  }

  resize();
  makeNodes();
  frame();

  window.addEventListener('resize', () => { resize(); makeNodes(); });
})();

/* =========================================================
   3D HERO OBJECT (Three.js) with mouse parallax + fallback
   ========================================================= */
(function initHeroOrb(){
  const wrap = document.getElementById('orbWrap');
  const fallback = document.getElementById('orbFallback');
  if (!wrap) return;

  const supportsWebGL = (() => {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e){ return false; }
  })();

  if (!supportsWebGL || typeof THREE === 'undefined'){
    fallback.hidden = false;
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, wrap.clientWidth / wrap.clientHeight || 1, 0.1, 100);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(wrap.clientWidth, wrap.clientHeight);
  wrap.appendChild(renderer.domElement);

  // Abstract "technology sphere": icosahedron wireframe + glowing nodes
  const geometry = new THREE.IcosahedronGeometry(1.6, 1);
  const material = new THREE.MeshBasicMaterial({
    color: 0x5ee7ff,
    wireframe: true,
    transparent: true,
    opacity: 0.55
  });
  const wireSphere = new THREE.Mesh(geometry, material);
  scene.add(wireSphere);

  const dotGeometry = new THREE.IcosahedronGeometry(1.6, 1);
  const dotsMaterial = new THREE.PointsMaterial({
    color: 0x8b7bff,
    size: 0.06,
    transparent: true,
    opacity: 0.9
  });
  const dots = new THREE.Points(dotGeometry, dotsMaterial);
  scene.add(dots);

  const innerGeometry = new THREE.IcosahedronGeometry(0.9, 0);
  const innerMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true,
    opacity: 0.18
  });
  const innerSphere = new THREE.Mesh(innerGeometry, innerMaterial);
  scene.add(innerSphere);

  let targetX = 0, targetY = 0;
  window.addEventListener('mousemove', (e) => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 0.6;
    targetY = (e.clientY / window.innerHeight - 0.5) * 0.6;
  });

  function resize(){
    if (!wrap.clientWidth || !wrap.clientHeight) return;
    camera.aspect = wrap.clientWidth / wrap.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
  }
  window.addEventListener('resize', resize);

  function animate(){
    if (!reduceMotion){
      wireSphere.rotation.y += 0.0025;
      wireSphere.rotation.x += 0.0009;
      dots.rotation.y += 0.0025;
      dots.rotation.x += 0.0009;
      innerSphere.rotation.y -= 0.0018;
    }
    // mouse parallax easing
    scene.rotation.y += (targetX - scene.rotation.y) * 0.04;
    scene.rotation.x += (targetY - scene.rotation.x) * 0.04;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
})();

/* =========================================================
   DOWNLOAD RESUME (placeholder-safe: no file bundled)
   ========================================================= */
const downloadResume = document.getElementById('downloadResume');
downloadResume.addEventListener('click', (e) => {
  e.preventDefault();
  const note = document.createElement('div');
  note.textContent = 'Add your resume file link here to enable this download.';
  note.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#11172a;border:1px solid #1f273f;color:#eef1fb;padding:10px 18px;border-radius:8px;font-size:0.85rem;z-index:999;';
  document.body.appendChild(note);
  setTimeout(() => note.remove(), 2600);
});

/* =========================================================
   CONTACT FORM: validation + mailto integration
   ========================================================= */
const contactForm = document.getElementById('contactForm');
const formNote = document.getElementById('formNote');

function setError(fieldId, message){
  const field = document.getElementById(fieldId).closest('.form-field');
  const errorEl = document.getElementById(`err-${fieldId.replace('cf-', '')}`);
  if (message){
    field.classList.add('invalid');
    errorEl.textContent = message;
  } else {
    field.classList.remove('invalid');
    errorEl.textContent = '';
  }
}

function isValidEmail(value){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = document.getElementById('cf-name').value.trim();
  const email = document.getElementById('cf-email').value.trim();
  const message = document.getElementById('cf-message').value.trim();

  let valid = true;

  if (!name){ setError('cf-name', 'Please enter your name.'); valid = false; }
  else setError('cf-name', '');

  if (!email){ setError('cf-email', 'Please enter your email.'); valid = false; }
  else if (!isValidEmail(email)){ setError('cf-email', 'Please enter a valid email address.'); valid = false; }
  else setError('cf-email', '');

  if (!message){ setError('cf-message', 'Please enter a message.'); valid = false; }
  else setError('cf-message', '');

  if (!valid){
    formNote.textContent = 'Please fix the highlighted fields.';
    return;
  }

  const subject = encodeURIComponent(`Portfolio contact from ${name}`);
  const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
  window.location.href = `mailto:hariniganesan2111@gmail.com?subject=${subject}&body=${body}`;

  formNote.textContent = 'Opening your email client…';
  contactForm.reset();
});