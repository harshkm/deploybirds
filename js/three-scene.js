/**
 * DeployBirds - Interactive 3D WebGL Flight Experience
 * Powered by Three.js - Procedural Cyber Stealth Craft with 9-Stage Scroll Choreography
 */

(function () {
  'use strict';

  // Check if WebGL container exists on page
  const container = document.getElementById('webgl-canvas-container');
  if (!container) return;

  // F-08: never start a fullscreen animation when the OS asks for less motion.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    document.documentElement.classList.add('no-webgl');
    return;
  }

  // F-29 / F-10: the library is deferred and may fail (blocked CDN, SRI
  // mismatch), and WebGL itself may be unavailable. Previously either case
  // threw and left the canvas layer blank with no fallback.
  if (typeof THREE === 'undefined') {
    document.documentElement.classList.add('no-webgl');
    console.warn('[three-scene] Three.js failed to load — using static backdrop.');
    return;
  }

  const webglSupported = (() => {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
                (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  })();

  if (!webglSupported) {
    document.documentElement.classList.add('no-webgl');
    console.warn('[three-scene] WebGL unavailable — using static backdrop.');
    return;
  }

  // F-28: cached instead of read on every scroll tick
  let isNarrow = window.innerWidth < 1024;

  // Scene Variables
  let scene, camera, renderer;
  let shipGroup, thrusterGlow, radarRing1, radarRing2, starfield, dataNodesGroup;
  let targetRotation = { x: 0, y: 0, z: 0 };
  let targetPosition = { x: 0, y: 0, z: 0 };
  let currentScrollPercent = 0;
  let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let clock = new THREE.Clock();

  // 9 Stage Choreography Configurations
  const stages = [
    // 01 · Launch & Initiation (Center Hero)
    { pos: { x: 0.8, y: 0.1, z: 0 }, rot: { x: 0.25, y: -0.6, z: 0.1 }, camZ: 7.5, ringScale: 1.0 },
    // 02 · Hardened Cloud Architecture (Move Right)
    { pos: { x: 2.0, y: -0.2, z: -0.5 }, rot: { x: 0.4, y: 0.7, z: -0.3 }, camZ: 7.2, ringScale: 1.3 },
    // 03 · Bespoke Web & Mobile (Move Left)
    { pos: { x: -2.0, y: 0.2, z: -0.2 }, rot: { x: -0.2, y: -0.8, z: 0.4 }, camZ: 7.0, ringScale: 1.1 },
    // 04 · Data Velocity (Right Bank Dive)
    { pos: { x: 1.9, y: 0.4, z: 0.3 }, rot: { x: 0.6, y: 1.1, z: -0.5 }, camZ: 6.8, ringScale: 1.4 },
    // 05 · VAPT & Bulletproof Defense (Left Shield Matrix)
    { pos: { x: -1.9, y: -0.1, z: 0.5 }, rot: { x: 0.1, y: 0.05, z: 0.0 }, camZ: 6.5, ringScale: 1.8 },
    // 06 · Tested to Breaking Point (Top-Down Tactical View)
    { pos: { x: 1.8, y: 0.0, z: -0.5 }, rot: { x: 1.1, y: 0.3, z: -0.2 }, camZ: 7.5, ringScale: 1.5 },
    // 07 · Continuous Monitoring & AMC (Left Elevation)
    { pos: { x: -1.8, y: 0.3, z: 0.2 }, rot: { x: -0.3, y: -0.5, z: 0.2 }, camZ: 7.2, ringScale: 1.2 },
    // 08 · Flexible Partnership Models (Right Ascent)
    { pos: { x: 1.8, y: -0.3, z: 0.4 }, rot: { x: -0.4, y: 0.8, z: -0.3 }, camZ: 6.8, ringScale: 1.3 },
    // 09 · Scale Your Product / Ready for Takeoff (Center Final)
    { pos: { x: 0.0, y: 0.8, z: 1.2 }, rot: { x: 0.3, y: 0.0, z: 0.0 }, camZ: 6.2, ringScale: 2.0 }
  ];

  function init() {
    // 1. Scene setup
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05070A, 0.06);

    // 2. Camera setup
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    camera.position.set(0, 0, 8);

    // 3. Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 4. Lighting
    setupLights();

    // 5. Build Procedural Cyber Ship & Environment
    buildCyberShip();
    buildStarfield();
    buildDataNodes();

    // 6. Event Listeners
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('scroll', onScroll, { passive: true });

    // Initial trigger
    onScroll();

    // 7. Render Loop
    animate();
  }

  function setupLights() {
    const ambientLight = new THREE.AmbientLight(0x131A24, 2.0);
    scene.add(ambientLight);

    // Main Neon Green Key Light
    const keyLight = new THREE.DirectionalLight(0x4D93FF, 3.5);
    keyLight.position.set(5, 8, 5);
    scene.add(keyLight);

    // Cyan Rim Light
    const rimLight = new THREE.DirectionalLight(0x7DD3FC, 2.0);
    rimLight.position.set(-6, -4, -4);
    scene.add(rimLight);

    // Deep Top Down Fill
    const topLight = new THREE.PointLight(0x4D93FF, 2.0, 20);
    topLight.position.set(0, 5, 2);
    scene.add(topLight);
  }

  function buildCyberShip() {
    shipGroup = new THREE.Group();

    // High tech dark obsidian material
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x080C12,
      metalness: 0.85,
      roughness: 0.25,
      flatShading: true
    });

    // Glowing Neon Lime Line Material
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x4D93FF,
      linewidth: 1.5,
      transparent: true,
      opacity: 0.85
    });

    // Emissive Core Material
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x4D93FF,
      wireframe: true
    });

    // 1. Central Aerodynamic Stealth Fuselage
    const fuselageGeo = new THREE.ConeGeometry(0.9, 3.4, 6);
    fuselageGeo.rotateX(Math.PI / 2);
    const fuselage = new THREE.Mesh(fuselageGeo, hullMat);
    const fuselageWire = new THREE.LineSegments(new THREE.EdgesGeometry(fuselageGeo), wireMat);
    fuselage.add(fuselageWire);
    shipGroup.add(fuselage);

    // 2. Swept-Back Cyber Delta Wings (Left & Right)
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(2.4, -1.2);
    wingShape.lineTo(2.2, -1.8);
    wingShape.lineTo(0.3, -1.2);
    wingShape.lineTo(0, 0);

    const extrudeSettings = { depth: 0.08, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
    wingGeo.rotateX(Math.PI / 2);

    // Right Wing
    const rightWing = new THREE.Mesh(wingGeo, hullMat);
    rightWing.position.set(0.3, 0, 0.4);
    rightWing.add(new THREE.LineSegments(new THREE.EdgesGeometry(wingGeo), wireMat));
    shipGroup.add(rightWing);

    // Left Wing (Mirrored)
    const leftWing = new THREE.Mesh(wingGeo, hullMat);
    leftWing.scale.set(-1, 1, 1);
    leftWing.position.set(-0.3, 0, 0.4);
    leftWing.add(new THREE.LineSegments(new THREE.EdgesGeometry(wingGeo), wireMat));
    shipGroup.add(leftWing);

    // 3. Twin Jet Thrusters & Plumes
    const thrusterGeo = new THREE.CylinderGeometry(0.18, 0.24, 0.9, 8);
    thrusterGeo.rotateX(Math.PI / 2);

    const t1 = new THREE.Mesh(thrusterGeo, hullMat);
    t1.position.set(0.4, 0.05, -1.4);
    t1.add(new THREE.LineSegments(new THREE.EdgesGeometry(thrusterGeo), wireMat));

    const t2 = new THREE.Mesh(thrusterGeo, hullMat);
    t2.position.set(-0.4, 0.05, -1.4);
    t2.add(new THREE.LineSegments(new THREE.EdgesGeometry(thrusterGeo), wireMat));

    shipGroup.add(t1);
    shipGroup.add(t2);

    // Glowing Ion Thruster Cores
    const glowGeo = new THREE.ConeGeometry(0.2, 1.2, 8);
    glowGeo.rotateX(-Math.PI / 2);
    const plumeMat = new THREE.MeshBasicMaterial({
      color: 0x4D93FF,
      transparent: true,
      opacity: 0.75
    });

    const plume1 = new THREE.Mesh(glowGeo, plumeMat);
    plume1.position.set(0.4, 0.05, -2.1);
    const plume2 = new THREE.Mesh(glowGeo, plumeMat);
    plume2.position.set(-0.4, 0.05, -2.1);

    shipGroup.add(plume1);
    shipGroup.add(plume2);
    thrusterGlow = [plume1, plume2];

    // 4. Orbiting Holographic Radar Gimbal Rings
    const ringGeo1 = new THREE.TorusGeometry(2.6, 0.015, 8, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x4D93FF, transparent: true, opacity: 0.35, wireframe: true });
    radarRing1 = new THREE.Mesh(ringGeo1, ringMat1);
    radarRing1.rotation.x = Math.PI / 3;
    shipGroup.add(radarRing1);

    const ringGeo2 = new THREE.TorusGeometry(3.1, 0.012, 6, 48);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x7DD3FC, transparent: true, opacity: 0.25, wireframe: true });
    radarRing2 = new THREE.Mesh(ringGeo2, ringMat2);
    radarRing2.rotation.y = Math.PI / 4;
    shipGroup.add(radarRing2);

    // Initial position
    shipGroup.position.set(stages[0].pos.x, stages[0].pos.y, stages[0].pos.z);
    shipGroup.rotation.set(stages[0].rot.x, stages[0].rot.y, stages[0].rot.z);

    scene.add(shipGroup);
  }

  function buildStarfield() {
    const starCount = 1800;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const idx = i * 3;
      starPos[idx] = (Math.random() - 0.5) * 60;
      starPos[idx + 1] = (Math.random() - 0.5) * 60;
      starPos[idx + 2] = (Math.random() - 0.5) * 40 - 5;

      // Colour variation across the blue palette. These are float RGB, not hex,
      // which is why a hex-based find/replace misses them — the green build left
      // lime and cyan specks in the starfield after the palette changed.
      const rand = Math.random();
      if (rand > 0.7) {
        // #4D93FF accent
        starColors[idx] = 0.302; starColors[idx + 1] = 0.576; starColors[idx + 2] = 1.0;
      } else if (rand > 0.4) {
        // #7DD3FC light rim
        starColors[idx] = 0.490; starColors[idx + 1] = 0.827; starColors[idx + 2] = 0.988;
      } else {
        // #EEF3FA near-white
        starColors[idx] = 0.933; starColors[idx + 1] = 0.953; starColors[idx + 2] = 0.980;
      }
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.65
    });

    starfield = new THREE.Points(starGeo, starMat);
    scene.add(starfield);
  }

  function buildDataNodes() {
    dataNodesGroup = new THREE.Group();
    const nodeGeo = new THREE.OctahedronGeometry(0.1, 0);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x4D93FF, wireframe: true });

    for (let i = 0; i < 16; i++) {
      const mesh = new THREE.Mesh(nodeGeo, nodeMat);
      const angle = (i / 16) * Math.PI * 2;
      const radius = 3.6 + Math.sin(i) * 0.8;
      mesh.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 2, Math.sin(angle) * radius);
      mesh.userData = { angle: angle, speed: 0.2 + Math.random() * 0.3, radius: radius };
      dataNodesGroup.add(mesh);
    }

    scene.add(dataNodesGroup);
  }

  function onMouseMove(e) {
    mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
  }

  function onScroll() {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (totalHeight <= 0) return;
    
    currentScrollPercent = Math.max(0, Math.min(1, window.scrollY / totalHeight));

    // Determine current stage & interpolation factor
    const stageIndex = currentScrollPercent * (stages.length - 1);
    const lowerIdx = Math.floor(stageIndex);
    const upperIdx = Math.min(stages.length - 1, lowerIdx + 1);
    const factor = stageIndex - lowerIdx;

    const cur = stages[lowerIdx];
    const nxt = stages[upperIdx];

    // Lerp Target Positions & Rotations
    targetPosition.x = cur.pos.x + (nxt.pos.x - cur.pos.x) * factor;
    targetPosition.y = cur.pos.y + (nxt.pos.y - cur.pos.y) * factor;
    targetPosition.z = cur.pos.z + (nxt.pos.z - cur.pos.z) * factor;

    targetRotation.x = cur.rot.x + (nxt.rot.x - cur.rot.x) * factor;
    targetRotation.y = cur.rot.y + (nxt.rot.y - cur.rot.y) * factor;
    targetRotation.z = cur.rot.z + (nxt.rot.z - cur.rot.z) * factor;

    // Mobile adjust (center & scale down)  — uses the cached flag (F-28)
    if (isNarrow) {
      targetPosition.x = 0;
      targetPosition.y = 0.5;
      targetPosition.z = -1.2;
    }
  }

  function onWindowResize() {
    isNarrow = window.innerWidth < 1024;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    onScroll();
  }

  // F-08: the loop used to run unconditionally, rendering in background tabs
  // and draining battery. It now stops whenever the page is hidden.
  let running = true;
  document.addEventListener('visibilitychange', () => {
    const wasRunning = running;
    running = !document.hidden;
    if (running && !wasRunning) {
      clock.getDelta();   // discard the idle gap so nothing jumps
      animate();
    }
  });

  function animate() {
    if (!running) return;
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // Smooth Mouse Parallax Interpolation
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    if (shipGroup) {
      // Natural hovering oscillation
      const hoverY = Math.sin(elapsedTime * 1.5) * 0.08;
      const hoverRoll = Math.cos(elapsedTime * 1.2) * 0.03;

      // Smooth Position & Rotation Interpolation
      shipGroup.position.x += (targetPosition.x + mouse.x * 0.4 - shipGroup.position.x) * 0.08;
      shipGroup.position.y += (targetPosition.y + hoverY + mouse.y * 0.3 - shipGroup.position.y) * 0.08;
      shipGroup.position.z += (targetPosition.z - shipGroup.position.z) * 0.08;

      shipGroup.rotation.x += (targetRotation.x - mouse.y * 0.15 - shipGroup.rotation.x) * 0.08;
      shipGroup.rotation.y += (targetRotation.y + mouse.x * 0.25 - shipGroup.rotation.y) * 0.08;
      shipGroup.rotation.z += (targetRotation.z + hoverRoll - mouse.x * 0.1 - shipGroup.rotation.z) * 0.08;

      // Thruster Flicker Pulse
      if (thrusterGlow) {
        const pulse = 0.8 + Math.sin(elapsedTime * 20) * 0.2;
        thrusterGlow.forEach(plume => {
          plume.scale.set(pulse, 1.0 + (pulse - 0.8) * 2.0, pulse);
        });
      }

      // Rotate Holographic Radar Rings
      if (radarRing1) {
        radarRing1.rotation.z += delta * 0.6;
        radarRing1.rotation.x += delta * 0.3;
      }
      if (radarRing2) {
        radarRing2.rotation.z -= delta * 0.4;
        radarRing2.rotation.y += delta * 0.5;
      }
    }

    // Parallax Starfield slow drift
    if (starfield) {
      starfield.rotation.y = elapsedTime * 0.02 + mouse.x * 0.05;
      starfield.rotation.x = elapsedTime * 0.01 + mouse.y * 0.03;
      starfield.position.y = -currentScrollPercent * 6;
    }

    // Orbit Data Nodes
    if (dataNodesGroup) {
      dataNodesGroup.children.forEach(node => {
        node.userData.angle += delta * node.userData.speed;
        node.position.x = Math.cos(node.userData.angle) * node.userData.radius;
        node.position.z = Math.sin(node.userData.angle) * node.userData.radius;
        node.rotation.x += delta * 2;
        node.rotation.y += delta * 1.5;
      });
    }

    renderer.render(scene, camera);
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
