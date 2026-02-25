import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer, RenderPass, BloomEffect, EffectPass, SMAAEffect, ToneMappingEffect, VignetteEffect, ToneMappingMode } from 'postprocessing';

export function createScene(container) {
  // ─── Renderer ───
  const renderer = new THREE.WebGLRenderer({
    antialias: false, // SMAA handles this
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.NoToneMapping; // postprocessing handles it
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // ─── Scene ───
  const scene = new THREE.Scene();
  const bgColor = new THREE.Color(0.58, 0.63, 0.68);
  scene.background = bgColor;
  scene.fog = new THREE.FogExp2(bgColor, 0.025);

  // ─── Camera ───
  const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 2.0, 12);
  camera.lookAt(0, 0.8, 0);

  // ─── Post-Processing ───
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloom = new BloomEffect({
    intensity: 0.8,
    luminanceThreshold: 0.5,
    luminanceSmoothing: 0.3,
    mipmapBlur: true,
  });

  const vignette = new VignetteEffect({
    offset: 0.35,
    darkness: 0.55,
  });

  const toneMapping = new ToneMappingEffect({
    mode: ToneMappingMode.AGX,
  });

  const smaa = new SMAAEffect();

  composer.addPass(new EffectPass(camera, bloom, vignette, toneMapping, smaa));

  // ─── Lighting ───
  // Key light (sun — cool blue-white)
  const sunLight = new THREE.DirectionalLight(0xd6e4f0, 3.5);
  sunLight.position.set(6, 12, 4);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 40;
  sunLight.shadow.camera.left = -10;
  sunLight.shadow.camera.right = 10;
  sunLight.shadow.camera.top = 10;
  sunLight.shadow.camera.bottom = -10;
  sunLight.shadow.bias = -0.001;
  scene.add(sunLight);

  // Fill light (subtle warm from opposite side)
  const fillLight = new THREE.DirectionalLight(0xffeedd, 0.8);
  fillLight.position.set(-4, 6, -6);
  scene.add(fillLight);

  // Rim light (back)
  const rimLight = new THREE.DirectionalLight(0xaaccff, 1.2);
  rimLight.position.set(-2, 8, -10);
  scene.add(rimLight);

  // Hemisphere for ambient
  const hemiLight = new THREE.HemisphereLight(0xc0d0e0, 0x556070, 0.6);
  scene.add(hemiLight);

  // Warm interior glow (point light inside igloo)
  const interiorGlow = new THREE.PointLight(0xff9944, 15, 8, 2);
  interiorGlow.position.set(0, 0.8, 0);
  scene.add(interiorGlow);

  // Entrance spill — entrance faces camera direction (atan2(-5,8) in Blender)
  const entranceDir = new THREE.Vector3(0.85, 0, -0.53).normalize(); // from center outward
  const entranceSpill = new THREE.SpotLight(0xffaa66, 6, 8, Math.PI / 4, 0.5);
  entranceSpill.position.set(0, 0.6, 0);
  entranceSpill.target.position.copy(entranceDir.clone().multiplyScalar(4));
  entranceSpill.target.position.y = 0.3;
  scene.add(entranceSpill);
  scene.add(entranceSpill.target);

  // ─── Ground ───
  const groundGeo = new THREE.PlaneGeometry(120, 120, 200, 200);
  const posAttr = groundGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const dist = Math.sqrt(x * x + y * y);
    // Gentle undulation, flat near center
    const h = dist > 6
      ? (Math.sin(x * 0.08) * Math.cos(y * 0.06) * 1.5 + Math.sin(x * 0.15 + y * 0.12) * 0.8) * Math.min((dist - 6) / 30, 1)
      : 0;
    posAttr.setZ(i, h);
  }
  groundGeo.computeVertexNormals();

  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x9eaab6,
    roughness: 0.92,
    metalness: 0.0,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.5;
  ground.receiveShadow = true;
  scene.add(ground);

  // ─── Snow base ring (covers igloo-ground gap) ───
  const baseRingGeo = new THREE.TorusGeometry(3.2, 0.6, 8, 32);
  const baseRing = new THREE.Mesh(baseRingGeo, groundMat);
  baseRing.rotation.x = -Math.PI / 2;
  baseRing.position.y = -0.35;
  baseRing.scale.y = 0.4;
  baseRing.receiveShadow = true;
  scene.add(baseRing);

  // ─── Snow drift mounds ───
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
    const dist = 4.0 + Math.random() * 2.5;
    const moundGeo = new THREE.SphereGeometry(0.5 + Math.random() * 0.6, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const mound = new THREE.Mesh(moundGeo, groundMat);
    mound.position.set(Math.cos(angle) * dist, -0.5, Math.sin(angle) * dist);
    mound.scale.set(1.2 + Math.random() * 0.8, 0.2 + Math.random() * 0.15, 1.2 + Math.random() * 0.8);
    mound.receiveShadow = true;
    scene.add(mound);
  }

  // ─── Mountains ───
  const mountainMat = new THREE.MeshStandardMaterial({
    color: 0x7a8896,
    roughness: 0.95,
    flatShading: true,
  });
  const mountains = [
    { x: -25, z: -35, s: 15, h: 18 },
    { x: 12, z: -45, s: 22, h: 25 },
    { x: 35, z: -30, s: 18, h: 16 },
    { x: -45, z: -50, s: 20, h: 22 },
    { x: 0, z: -55, s: 28, h: 28 },
    { x: -15, z: -25, s: 10, h: 11 },
    { x: 25, z: -22, s: 8, h: 9 },
  ];
  mountains.forEach(({ x, z, s, h }) => {
    const geo = new THREE.ConeGeometry(s, h, 5 + Math.floor(Math.random() * 3));
    const m = new THREE.Mesh(geo, mountainMat.clone());
    m.material.color.setHSL(0.58, 0.06, 0.44 + Math.random() * 0.08);
    m.position.set(x, h / 2 - 2, z);
    m.rotation.y = Math.random() * Math.PI;
    scene.add(m);
  });

  // ─── Snow Particles ───
  const snowCount = 2000;
  const snowGeo = new THREE.BufferGeometry();
  const snowPositions = new Float32Array(snowCount * 3);
  const snowSizes = new Float32Array(snowCount);
  for (let i = 0; i < snowCount; i++) {
    snowPositions[i * 3] = (Math.random() - 0.5) * 60;
    snowPositions[i * 3 + 1] = Math.random() * 25;
    snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    snowSizes[i] = 0.02 + Math.random() * 0.04;
  }
  snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
  snowGeo.setAttribute('size', new THREE.BufferAttribute(snowSizes, 1));

  const snowMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.06,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const snowParticles = new THREE.Points(snowGeo, snowMat);
  scene.add(snowParticles);

  // ─── Load Igloo Model ───
  let iglooBlocks = [];
  let iglooGroup = null;
  const loader = new GLTFLoader();
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let hoveredBlock = null;

  // Custom ice material
  function createIceMaterial() {
    return new THREE.MeshPhysicalMaterial({
      color: 0xb0c8d8,
      roughness: 0.12,
      metalness: 0.0,
      transmission: 0.55,
      thickness: 1.2,
      ior: 1.31,
      clearcoat: 0.4,
      clearcoatRoughness: 0.08,
      attenuationColor: new THREE.Color(0x7799bb),
      attenuationDistance: 1.5,
      envMapIntensity: 1.2,
      side: THREE.DoubleSide,
      sheen: 0.1,
      sheenColor: new THREE.Color(0xaaddff),
    });
  }

  const modelPromise = new Promise((resolve) => {
    loader.load(
      '/models/igloo-blender.glb',
      (gltf) => {
        iglooGroup = gltf.scene;

        // Model is already properly sized (~6 units wide, ~2.7 tall)
        // Just center it on xz and sit on ground
        const box = new THREE.Box3().setFromObject(iglooGroup);
        const center = box.getCenter(new THREE.Vector3());
        iglooGroup.position.set(-center.x, -box.min.y, -center.z);

        // Apply ice material to all blocks
        const iceMat = createIceMaterial();
        iglooGroup.traverse((child) => {
          if (child.isMesh) {
            child.material = iceMat.clone();
            child.castShadow = true;
            child.receiveShadow = true;
            // Store original position for hover animation
            child.userData.originalPosition = child.position.clone();
            child.userData.originalScale = child.scale.clone();
            child.userData.hoverAmount = 0;
            iglooBlocks.push(child);
          }
        });

        scene.add(iglooGroup);
        resolve();
      },
      undefined,
      (err) => {
        console.warn('GLB load failed, creating fallback:', err);
        // Fallback procedural igloo
        const group = new THREE.Group();
        const iceMat = createIceMaterial();
        for (let row = 0; row < 8; row++) {
          const rowAngle = (row / 8) * (Math.PI / 2);
          const r = 2.5 * Math.cos(rowAngle);
          const y = 2.5 * Math.sin(rowAngle) * 0.9;
          const count = Math.max(4, Math.round(28 * (r / 2.5)));
          for (let b = 0; b < count; b++) {
            const a = (b / count) * Math.PI * 2 + (row % 2 ? Math.PI / count : 0);
            const geo = new THREE.BoxGeometry(0.5, 0.25, 0.25);
            const mesh = new THREE.Mesh(geo, iceMat.clone());
            mesh.position.set(Math.cos(a) * r, y + 0.15, Math.sin(a) * r);
            mesh.lookAt(0, y + 0.15, 0);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData.originalPosition = mesh.position.clone();
            mesh.userData.originalScale = mesh.scale.clone();
            mesh.userData.hoverAmount = 0;
            iglooBlocks.push(mesh);
            group.add(mesh);
          }
        }
        scene.add(group);
        iglooGroup = group;
        resolve();
      }
    );
  });

  // ─── Hover Interaction ───
  function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }
  window.addEventListener('mousemove', onMouseMove, { passive: true });

  // ─── Camera Orbit ───
  const cameraOrbit = {
    angle: 0,
    radius: 12,
    height: 2.0,
    lookAtY: 0.8,
  };

  function updateCamera(scrollProgress) {
    cameraOrbit.angle = scrollProgress * Math.PI * 2;
    // Slight height variation during orbit
    const h = cameraOrbit.height + Math.sin(scrollProgress * Math.PI) * 1.2;
    camera.position.x = Math.sin(cameraOrbit.angle) * cameraOrbit.radius;
    camera.position.z = Math.cos(cameraOrbit.angle) * cameraOrbit.radius;
    camera.position.y = h;
    camera.lookAt(0, cameraOrbit.lookAtY, 0);
  }

  // ─── Resize ───
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  // ─── Animation Loop ───
  const clock = new THREE.Clock();
  let animationId;

  function animate() {
    animationId = requestAnimationFrame(animate);
    const dt = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    // Animate snow
    const snowPos = snowParticles.geometry.attributes.position;
    for (let i = 0; i < snowCount; i++) {
      let y = snowPos.getY(i);
      y -= (0.3 + snowSizes[i] * 3) * dt;
      // Gentle horizontal drift
      const x = snowPos.getX(i) + Math.sin(elapsed * 0.3 + i) * 0.005;
      const z = snowPos.getZ(i) + Math.cos(elapsed * 0.2 + i * 0.5) * 0.003;
      if (y < -0.5) y = 20 + Math.random() * 5;
      snowPos.setXYZ(i, x, y, z);
    }
    snowPos.needsUpdate = true;

    // Interior glow flicker
    interiorGlow.intensity = 8 + Math.sin(elapsed * 2.5) * 1.5 + Math.sin(elapsed * 4.1) * 0.8;

    // Hover raycasting
    if (iglooBlocks.length > 0) {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(iglooBlocks, false);
      const newHovered = intersects.length > 0 ? intersects[0].object : null;

      // Animate hover
      for (const block of iglooBlocks) {
        const isHovered = block === newHovered;
        const target = isHovered ? 1 : 0;
        block.userData.hoverAmount += (target - block.userData.hoverAmount) * 0.1;
        const h = block.userData.hoverAmount;

        if (h > 0.01) {
          // Push block outward from center
          const orig = block.userData.originalPosition;
          const dir = orig.clone().normalize();
          block.position.copy(orig).addScaledVector(dir, h * 0.15);
          // Slight scale up
          const s = 1 + h * 0.08;
          block.scale.copy(block.userData.originalScale).multiplyScalar(s);
          // Glow — increase emissive
          if (block.material.emissive) {
            block.material.emissive.setHSL(0.55, 0.3, h * 0.15);
            block.material.emissiveIntensity = h * 0.5;
          }
        } else {
          block.position.copy(block.userData.originalPosition);
          block.scale.copy(block.userData.originalScale);
          if (block.material.emissive) {
            block.material.emissive.setHSL(0, 0, 0);
            block.material.emissiveIntensity = 0;
          }
        }
      }
      hoveredBlock = newHovered;
    }

    // Change cursor
    renderer.domElement.style.cursor = hoveredBlock ? 'pointer' : '';

    composer.render();
  }
  animate();

  return { renderer, scene, camera, updateCamera, modelPromise };
}
