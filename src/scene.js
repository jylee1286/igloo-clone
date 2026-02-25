import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function createScene(container) {
  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9ca8b4);
  scene.fog = new THREE.FogExp2(0x9ca8b4, 0.025);

  // Camera
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 4, 12);
  camera.lookAt(0, 1.5, 0);

  // Lights
  const ambientLight = new THREE.AmbientLight(0xc0cdd8, 0.8);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xe8eef4, 2.2);
  dirLight.position.set(5, 10, 5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 50;
  dirLight.shadow.camera.left = -15;
  dirLight.shadow.camera.right = 15;
  dirLight.shadow.camera.top = 15;
  dirLight.shadow.camera.bottom = -15;
  scene.add(dirLight);

  // Subtle rim light from behind
  const rimLight = new THREE.DirectionalLight(0xc0d8f0, 0.8);
  rimLight.position.set(-3, 6, -8);
  scene.add(rimLight);

  // Hemisphere light for natural sky/ground
  const hemiLight = new THREE.HemisphereLight(0xb0c4de, 0x666677, 0.4);
  scene.add(hemiLight);

  // Ground plane — snowy terrain
  const groundGeo = new THREE.PlaneGeometry(200, 200, 128, 128);
  // Displace vertices for hilly terrain
  const posAttr = groundGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const dist = Math.sqrt(x * x + y * y);
    // Flat near center, hilly further out
    const hillHeight = dist > 8
      ? (Math.sin(x * 0.15) * Math.cos(y * 0.12) * 3 + Math.sin(x * 0.08 + y * 0.06) * 5) * Math.min((dist - 8) / 20, 1)
      : 0;
    posAttr.setZ(i, hillHeight);
  }
  groundGeo.computeVertexNormals();

  const groundMat = new THREE.MeshStandardMaterial({
    color: 0xb0bcc8,
    roughness: 0.9,
    metalness: 0.02,
    flatShading: false,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.5;
  ground.receiveShadow = true;
  scene.add(ground);

  // Mountains in background (simple cones with fog)
  const mountainMat = new THREE.MeshStandardMaterial({
    color: 0x8a96a2,
    roughness: 0.95,
    metalness: 0.0,
    flatShading: true,
  });

  const mountainPositions = [
    { x: -30, z: -40, scale: 18, height: 22 },
    { x: 15, z: -50, scale: 25, height: 28 },
    { x: 40, z: -35, scale: 20, height: 20 },
    { x: -50, z: -55, scale: 22, height: 25 },
    { x: 0, z: -60, scale: 30, height: 30 },
    { x: -20, z: -30, scale: 12, height: 14 },
    { x: 30, z: -25, scale: 10, height: 12 },
  ];

  mountainPositions.forEach(({ x, z, scale, height }) => {
    const geo = new THREE.ConeGeometry(scale, height, 6 + Math.floor(Math.random() * 4));
    const mesh = new THREE.Mesh(geo, mountainMat.clone());
    mesh.material.color.setHSL(0.58, 0.08, 0.48 + Math.random() * 0.1);
    mesh.position.set(x, height / 2 - 2, z);
    mesh.rotation.y = Math.random() * Math.PI;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    scene.add(mesh);
  });

  // Load igloo model
  let iglooModel = null;
  const loader = new GLTFLoader();

  const modelPromise = new Promise((resolve, reject) => {
    loader.load(
      '/models/refined_model.glb',
      (gltf) => {
        iglooModel = gltf.scene;
        // Center and scale the model
        const box = new THREE.Box3().setFromObject(iglooModel);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetSize = 5;
        const scaleFactor = targetSize / maxDim;
        iglooModel.scale.setScalar(scaleFactor);
        // Recenter
        iglooModel.position.x = -center.x * scaleFactor;
        iglooModel.position.y = -box.min.y * scaleFactor;
        iglooModel.position.z = -center.z * scaleFactor;

        iglooModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            // Desaturate to match monochromatic palette
            if (child.material) {
              const mat = child.material;
              // Override color to grey-ice tone
              mat.color = new THREE.Color(0xa8b8c8);
              mat.roughness = 0.7;
              mat.metalness = 0.05;
              // If textured, tint the map towards grey
              if (mat.map) {
                mat.color.set(0xc0ccd6);
              }
            }
          }
        });

        scene.add(iglooModel);
        resolve();
      },
      undefined,
      (err) => {
        console.error('Model load error:', err);
        // Fallback: create a simple igloo shape
        const fallbackGeo = new THREE.SphereGeometry(2.5, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        const fallbackMat = new THREE.MeshStandardMaterial({ color: 0xc8d8e8, roughness: 0.7 });
        const fallback = new THREE.Mesh(fallbackGeo, fallbackMat);
        fallback.castShadow = true;
        scene.add(fallback);
        resolve();
      }
    );
  });

  // Resize handler
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  // Camera orbit state
  const cameraState = {
    angle: 0,
    radius: 12,
    height: 4,
    lookAtY: 1.5,
  };

  function updateCamera(scrollProgress) {
    // Map 0-1 scroll to full 360° orbit
    cameraState.angle = scrollProgress * Math.PI * 2;
    camera.position.x = Math.sin(cameraState.angle) * cameraState.radius;
    camera.position.z = Math.cos(cameraState.angle) * cameraState.radius;
    camera.position.y = cameraState.height + Math.sin(scrollProgress * Math.PI) * 1.5;
    camera.lookAt(0, cameraState.lookAtY, 0);
  }

  // Render loop
  let animationId;
  function animate() {
    animationId = requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();

  return { renderer, scene, camera, updateCamera, modelPromise };
}
