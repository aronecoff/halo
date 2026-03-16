// ── HALO ──

// ── Loader ──
window.addEventListener('load', () => {
  setTimeout(() => document.getElementById('loader').classList.add('hidden'), 800);
});

// ── Lenis Smooth Scroll ──
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
});
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// ── Mobile Menu ──
const menuBtn = document.querySelector('.mobile-menu');
const mobileNav = document.querySelector('.mobile-nav');
menuBtn?.addEventListener('click', () => mobileNav.classList.toggle('open'));
document.querySelectorAll('.mobile-nav a').forEach(a =>
  a.addEventListener('click', () => mobileNav.classList.remove('open'))
);

// ── Header Hide on Scroll ──
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const header = document.querySelector('.site-header');
  const y = window.scrollY;
  if (y > lastScroll && y > 100) header.classList.add('hidden');
  else header.classList.remove('hidden');
  lastScroll = y;
});

// ── Three.js Orb (Hero) ──
function initOrb() {
  const canvas = document.getElementById('orb-canvas');
  if (!canvas) return;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const geo = new THREE.IcosahedronGeometry(1.4, 64);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color('#7C3AED') },
      uColor2: { value: new THREE.Color('#60A5FA') },
      uColor3: { value: new THREE.Color('#2dd4bf') },
    },
    vertexShader: `
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vDisplacement;

      vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(
          i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
      }

      void main() {
        vNormal = normal;
        vPosition = position;
        float noise = snoise(position * 1.5 + uTime * 0.3) * 0.15;
        noise += snoise(position * 3.0 + uTime * 0.5) * 0.05;
        vDisplacement = noise;
        vec3 newPos = position + normal * noise;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vDisplacement;

      void main() {
        float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);
        vec3 color = mix(uColor1, uColor2, fresnel);
        color = mix(color, uColor3, vDisplacement * 3.0 + 0.3);
        float glow = fresnel * 0.6 + 0.4;
        gl_FragColor = vec4(color * glow, 0.85 + fresnel * 0.15);
      }
    `,
    transparent: true,
  });

  const orb = new THREE.Mesh(geo, mat);
  scene.add(orb);

  const ringGeo = new THREE.BufferGeometry();
  const ringCount = 800;
  const ringPos = new Float32Array(ringCount * 3);
  for (let i = 0; i < ringCount; i++) {
    const angle = (i / ringCount) * Math.PI * 2;
    const r = 2.2 + (Math.random() - 0.5) * 0.3;
    ringPos[i * 3] = Math.cos(angle) * r;
    ringPos[i * 3 + 1] = (Math.random() - 0.5) * 0.15;
    ringPos[i * 3 + 2] = Math.sin(angle) * r;
  }
  ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPos, 3));
  const ringMat = new THREE.PointsMaterial({
    color: 0xA78BFA, size: 0.015,
    transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending,
  });
  const ring = new THREE.Points(ringGeo, ringMat);
  ring.rotation.x = 0.3;
  scene.add(ring);

  const partGeo = new THREE.BufferGeometry();
  const partCount = 300;
  const partPos = new Float32Array(partCount * 3);
  for (let i = 0; i < partCount; i++) {
    partPos[i * 3] = (Math.random() - 0.5) * 8;
    partPos[i * 3 + 1] = (Math.random() - 0.5) * 8;
    partPos[i * 3 + 2] = (Math.random() - 0.5) * 4;
  }
  partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
  const partMat = new THREE.PointsMaterial({
    color: 0x60A5FA, size: 0.008,
    transparent: true, opacity: 0.3,
    blending: THREE.AdditiveBlending,
  });
  const particles = new THREE.Points(partGeo, partMat);
  scene.add(particles);

  let time = 0;
  function animate() {
    requestAnimationFrame(animate);
    time += 0.005;
    mat.uniforms.uTime.value = time * 2;
    orb.rotation.y = time * 0.3;
    orb.rotation.x = Math.sin(time * 0.5) * 0.1;
    ring.rotation.z = time * 0.1;
    ring.rotation.y = time * 0.05;
    particles.rotation.y = time * 0.02;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  });
}

// ── CTA Background Particles ──
function initCtaParticles() {
  const canvas = document.getElementById('cta-canvas');
  if (!canvas) return;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const geo = new THREE.BufferGeometry();
  const count = 500;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 12;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0x7C3AED, size: 0.02,
    transparent: true, opacity: 0.4,
    blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.001;
    pts.rotation.y = t;
    pts.rotation.x = Math.sin(t) * 0.1;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  });
}

// ── Scroll Animations (varied + staggered) ──
function initScrollAnimations() {
  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll('[data-anim]').forEach((el) => {
    const delay = parseInt(el.dataset.delay || '0') * 120;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      onEnter: () => {
        setTimeout(() => el.classList.add('visible'), delay);
      },
    });
  });

  // Parallax hero orb
  gsap.to('#orb-canvas', {
    yPercent: 20, ease: 'none',
    scrollTrigger: {
      trigger: '.hero', start: 'top top',
      end: 'bottom top', scrub: true,
    }
  });
}

// ── Waitlist Form ──
document.getElementById('waitlist-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = e.target.querySelector('input');
  const btn = e.target.querySelector('button');
  const contact = input.value.trim();

  if (!contact) return;

  btn.textContent = 'Sending...';
  btn.disabled = true;

  try {
    await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact }),
    });
  } catch (err) {
    // Silent fail
  }

  btn.textContent = 'Added!';
  btn.style.background = '#059669';
  btn.disabled = false;
  input.value = '';
  setTimeout(() => {
    btn.textContent = "Reserve My Spot";
    btn.style.background = '';
  }, 3000);
});

// ── Init ──
initOrb();
initCtaParticles();
initScrollAnimations();
