/* ============================================
   AMBIENT 3D COSMOS
   A drifting field of stars with soft nebula-glow
   clouds in the video's own palette (violet, gold,
   rose, teal), plus the occasional shooting star.
   Sits fixed behind the content, mouse-reactive,
   and stays still if the user prefers reduced motion.
   ============================================ */
(function cosmicBG(){
  const mount = document.getElementById('cosmic-bg');
  if (!mount || typeof THREE === 'undefined') return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 6;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);
  mount.appendChild(renderer.domElement);

  /* ---------- Starfield ---------- */
  const STAR_COUNT = 900;
  const starPos = new Float32Array(STAR_COUNT * 3);
  const starCol = new Float32Array(STAR_COUNT * 3);
  const starSize = new Float32Array(STAR_COUNT);

  const palette = [
    [0.93, 0.92, 0.97], // ink white-lavender (majority)
    [0.91, 0.69, 0.29], // gold
    [0.35, 0.83, 0.65], // teal
  ];
  const weights = [0.82, 0.11, 0.07];

  function pickColor(){
    const r = Math.random();
    let acc = 0;
    for (let i = 0; i < weights.length; i++){
      acc += weights[i];
      if (r <= acc) return palette[i];
    }
    return palette[0];
  }

  for (let i = 0; i < STAR_COUNT; i++){
    const radius = 8 + Math.random() * 32;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    starPos[i*3]     = radius * Math.sin(phi) * Math.cos(theta);
    starPos[i*3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    starPos[i*3 + 2] = radius * Math.cos(phi) - 10;

    const c = pickColor();
    starCol[i*3] = c[0]; starCol[i*3+1] = c[1]; starCol[i*3+2] = c[2];
    starSize[i] = Math.random() * 0.05 + 0.015;
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));

  const starMat = new THREE.PointsMaterial({
    size: 0.045,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  /* ---------- Soft nebula glow clouds ---------- */
  function makeGlowTexture(hex){
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grad.addColorStop(0, hex + 'ff'.replace('ff','66'));
    grad.addColorStop(0, hexToRgba(hex, 0.55));
    grad.addColorStop(0.4, hexToRgba(hex, 0.22));
    grad.addColorStop(1, hexToRgba(hex, 0));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  }
  function hexToRgba(hex, a){
    const v = parseInt(hex.replace('#',''), 16);
    const r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
    return `rgba(${r},${g},${b},${a})`;
  }

  const cloudDefs = [
    { color:'#4b3b87', size: 9,  pos:[-6,  2, -14] },
    { color:'#b0577c', size: 7,  pos:[ 7, -1, -18] },
    { color:'#e7b049', size: 5,  pos:[-3, -4, -10] },
    { color:'#58d3a6', size: 4.5,pos:[ 5,  4, -16] },
    { color:'#4b3b87', size: 8,  pos:[ 1,  6, -22] },
  ];

  const clouds = cloudDefs.map(def => {
    const tex = makeGlowTexture(def.color);
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(def.size, def.size, 1);
    sprite.position.set(...def.pos);
    scene.add(sprite);
    return { sprite, phase: Math.random() * Math.PI * 2, speed: 0.15 + Math.random() * 0.15 };
  });

  /* ---------- Shooting stars ---------- */
  const shootMat = new THREE.LineBasicMaterial({ color: 0xedebf7, transparent: true, opacity: 0 });
  const shootGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0)
  ]);
  const shootingStar = new THREE.Line(shootGeo, shootMat);
  scene.add(shootingStar);

  let shootTimer = 2 + Math.random() * 4;
  let shootActive = false;
  let shootProgress = 0;
  let shootStart = new THREE.Vector3();
  let shootDir = new THREE.Vector3();

  function triggerShootingStar(){
    shootStart.set(
      (Math.random() - 0.5) * 14 + 4,
      3 + Math.random() * 3,
      -6 - Math.random() * 6
    );
    shootDir.set(-1.6, -0.9, 0).normalize();
    shootActive = true;
    shootProgress = 0;
  }

  /* ---------- Mouse parallax ---------- */
  let targetX = 0, targetY = 0, curX = 0, curY = 0;
  window.addEventListener('pointermove', (e) => {
    targetX = ((e.clientX / window.innerWidth) - 0.5);
    targetY = ((e.clientY / window.innerHeight) - 0.5);
  });

  const clock = new THREE.Clock();

  function animate(){
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.getElapsedTime();

    if (!reduceMotion){
      stars.rotation.y = t * 0.008;
      stars.rotation.x = t * 0.003;

      clouds.forEach(c => {
        c.sprite.position.y += Math.sin(t * c.speed + c.phase) * 0.0009;
        c.sprite.position.x += Math.cos(t * c.speed * 0.8 + c.phase) * 0.0007;
        c.sprite.material.rotation = t * 0.02;
      });

      curX += (targetX - curX) * 0.02;
      curY += (targetY - curY) * 0.02;
      camera.position.x = curX * 0.6;
      camera.position.y = -curY * 0.6;
      camera.lookAt(0, 0, -10);

      shootTimer -= dt;
      if (shootTimer <= 0 && !shootActive){
        triggerShootingStar();
        shootTimer = 6 + Math.random() * 6;
      }
      if (shootActive){
        shootProgress += dt * 1.1;
        const len = 2.4;
        const head = shootStart.clone().add(shootDir.clone().multiplyScalar(shootProgress * 6));
        const tail = head.clone().add(shootDir.clone().multiplyScalar(-len));
        shootGeo.setFromPoints([head, tail]);
        const fade = Math.sin(Math.min(shootProgress / 0.9, 1) * Math.PI);
        shootMat.opacity = fade * 0.9;
        if (shootProgress >= 0.9) shootActive = false;
      }
    }

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
