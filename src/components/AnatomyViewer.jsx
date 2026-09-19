import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function createFallbackModel(scene) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0xd7d2c7, roughness: 0.72, metalness: 0.02 });
  const highlight = new THREE.MeshStandardMaterial({ color: 0xe66c4b, emissive: 0x5c1d11, emissiveIntensity: 0.45, roughness: 0.5 });
  const addBone = (position, scale, highlighted = false) => {
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.8, 5, 10), highlighted ? highlight : material);
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    mesh.rotation.z = position[0] * 0.25;
    group.add(mesh);
  };
  addBone([0, 2.25, 0], [1.35, 1.05, 0.8]);
  addBone([0, 0.85, 0], [0.8, 1.5, 0.6]);
  addBone([-0.95, 0.35, 0], [0.32, 1.9, 0.32]);
  addBone([0.95, 0.35, 0], [0.32, 1.9, 0.32]);
  addBone([-0.48, -1.35, 0], [0.4, 2.0, 0.4]);
  addBone([0.48, -1.35, 0], [0.4, 2.0, 0.4]);
  scene.add(group);
  return { root: group, fallback: true };
}

export function findStructure(model, meshNames = []) {
  const matches = new Set();
  if (!model || !meshNames.length) return matches;
  model.traverse((object) => {
    if (!meshNames.includes(object.name)) return;
    if (object.isMesh && !object.userData.isModelLabel) matches.add(object);
    object.traverse((child) => {
      if (child.isMesh && !child.userData.isModelLabel) matches.add(child);
    });
  });
  return [...matches];
}

function clearHighlights(root) {
  root.traverse((object) => {
    if (!object.isMesh) return;
    if (object.userData.highlightOutline) {
      object.remove(object.userData.highlightOutline);
      object.userData.highlightOutline.geometry.dispose();
      object.userData.highlightOutline.material.dispose();
      delete object.userData.highlightOutline;
    }
  });
}

function hideModelLabels(root) {
  let hiddenLabels = 0;
  root.traverse((object) => {
    if (!object.isMesh) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const isTextOnly = materials.length > 0 && materials.every((material) => material.name === 'Text');
    if (isTextOnly) {
      object.geometry = object.geometry.clone();
      object.geometry.setDrawRange(0, 0);
      object.userData.isModelLabel = true;
      hiddenLabels += 1;
      return;
    }
    const hiddenMaterials = materials.map((material) => {
      if (material.name !== 'Text') return material;
      const invisibleMaterial = material.clone();
      invisibleMaterial.transparent = true;
      invisibleMaterial.opacity = 0;
      invisibleMaterial.depthWrite = false;
      hiddenLabels += 1;
      return invisibleMaterial;
    });
    object.material = Array.isArray(object.material) ? hiddenMaterials : hiddenMaterials[0];
  });
  return hiddenLabels;
}

function applyHighlight(model, structure, controls, camera) {
  clearHighlights(model.root);
  const highlightedMeshes = findStructure(model.root, structure?.meshNames);
  const highlightedSet = new Set(highlightedMeshes);
  const outlineMaterial = new THREE.LineBasicMaterial({ color: 0xffc857, transparent: true, opacity: 0.95 });

  model.root.traverse((object) => {
    if (!object.isMesh) return;
    if (object.userData.isModelLabel) return;
    const highlighted = highlightedSet.has(object);
    const sourceMaterials = Array.isArray(object.material) ? object.material : [object.material];
    const materials = sourceMaterials.map((source) => {
      const material = source.clone();
      if (source.name === 'Text') {
        material.transparent = true;
        material.opacity = 0;
        material.depthWrite = false;
        return material;
      }
      material.color?.set(highlighted ? 0xe66c4b : model.fallback ? 0xd7d2c7 : 0x9a9183);
      material.emissive?.set(highlighted ? 0x7d2413 : 0x000000);
      if ('emissiveIntensity' in material) material.emissiveIntensity = highlighted ? 0.85 : 0;
      material.transparent = !highlighted;
      material.opacity = highlighted ? 1 : 0.3;
      return material;
    });
    object.material = Array.isArray(object.material) ? materials : materials[0];
    if (highlighted) {
      const outline = new THREE.LineSegments(new THREE.EdgesGeometry(object.geometry, 24), outlineMaterial.clone());
      object.add(outline);
      object.userData.highlightOutline = outline;
    }
  });

  if (!highlightedMeshes.length) return;
  const bounds = new THREE.Box3();
  highlightedMeshes.forEach((mesh) => bounds.expandByObject(mesh));
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z, 0.5);
  controls.target.copy(center);
  camera.position.set(center.x + radius * 2.1, center.y + radius * 0.7, center.z + radius * 2.1);
  camera.near = Math.max(radius / 100, 0.01);
  camera.far = Math.max(radius * 30, 100);
  camera.updateProjectionMatrix();
}

function centerStructure(model, structure, controls, camera) {
  const highlightedMeshes = findStructure(model.root, structure?.meshNames);
  if (!highlightedMeshes.length) return;
  const bounds = new THREE.Box3();
  highlightedMeshes.forEach((mesh) => bounds.expandByObject(mesh));
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z, 0.5);
  controls.target.copy(center);
  camera.position.set(center.x + radius * 2.1, center.y + radius * 0.7, center.z + radius * 2.1);
  camera.near = Math.max(radius / 100, 0.01);
  camera.far = Math.max(radius * 30, 100);
  camera.updateProjectionMatrix();
  controls.update();
}

function zoomCamera(camera, controls, direction) {
  const offset = camera.position.clone().sub(controls.target);
  const distance = offset.length();
  const nextDistance = THREE.MathUtils.clamp(distance * (direction < 0 ? 0.72 : 1.38), 0.15, 100);
  camera.position.copy(controls.target).add(offset.normalize().multiplyScalar(nextDistance));
  controls.update();
}

export default function AnatomyViewer({ structure }) {
  const mountRef = useRef(null);
  const modelRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const [modelState, setModelState] = useState('loading');

  const recenter = () => {
    const model = modelRef.current;
    if (!model || !cameraRef.current || !controlsRef.current) return;
    centerStructure(model, structure, controlsRef.current, cameraRef.current);
  };

  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x182321);
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.3, 8.4);
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setModelState('unavailable');
      return () => {};
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xfff8e8, 0x1b2b2a, 2.1));
    const keyLight = new THREE.DirectionalLight(0xffe9ca, 3.2);
    keyLight.position.set(4, 6, 7);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x7cc7c6, 1.5);
    rimLight.position.set(-5, 2, -3);
    scene.add(rimLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = true;
    controls.zoomSpeed = 1.35;
    controls.minDistance = 0.15;
    controls.maxDistance = 100;
    controls.target.set(0, 0, 0);
    cameraRef.current = camera;
    controlsRef.current = controls;

    const resize = () => {
      const width = mount.clientWidth || 640;
      const height = mount.clientHeight || 520;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    window.addEventListener('resize', resize);
    let animationFrame;
    const animate = () => {
      animationFrame = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const loader = new GLTFLoader();
    loader.load('/models/z-anatomy/anatomy.glb', (gltf) => {
      hideModelLabels(gltf.scene);
      modelRef.current = { root: gltf.scene, fallback: false };
      scene.add(gltf.scene);
      setModelState('ready');
    }, undefined, () => {
      modelRef.current = createFallbackModel(scene);
      setModelState('fallback');
    });

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
      controls.dispose();
      cameraRef.current = null;
      controlsRef.current = null;
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
    };
  }, []);

  useEffect(() => {
    const model = modelRef.current;
    if (!model) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (camera && controls) applyHighlight(model, structure, controls, camera);
  }, [structure, modelState]);

  return (
    <div className="viewer-shell">
      <div ref={mountRef} className="anatomy-canvas" aria-label="Visualizador 3D anatômico" />
      <div className="viewer-badge"><span className="live-dot" /> {modelState === 'ready' ? 'Modelo Z-Anatomy' : modelState === 'fallback' ? 'Pré-visualização 3D' : modelState === 'unavailable' ? 'WebGL indisponível' : 'Carregando modelo'}</div>
      {modelState === 'ready' && <div className="highlight-badge"><span /> estrutura em destaque</div>}
      {modelState === 'ready' && <div className="viewer-controls"><button className="zoom-button" onClick={() => zoomCamera(cameraRef.current, controlsRef.current, -1)} type="button" aria-label="Aproximar modelo">+</button><button className="zoom-button" onClick={() => zoomCamera(cameraRef.current, controlsRef.current, 1)} type="button" aria-label="Afastar modelo">−</button><button className="recenter-button" onClick={recenter} type="button"><span>⌖</span> Centralizar osso</button></div>}
      {modelState === 'fallback' && <div className="viewer-note">Adicione o arquivo <strong>anatomy.glb</strong> em public/models/z-anatomy para ativar o modelo oficial.</div>}
      {modelState === 'unavailable' && <div className="viewer-note">Este navegador não disponibilizou WebGL para esta sessão. Abra a aplicação em um navegador com aceleração 3D ativa.</div>}
      <div className="viewer-hint">Arraste para girar · Scroll para aproximar</div>
    </div>
  );
}
