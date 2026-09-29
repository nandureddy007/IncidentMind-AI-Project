import { useEffect, useRef } from 'react';
import * as THREE from 'three';

function TopologyScene({ incidentCount, openCount }) {
  const hostRef = useRef(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }); } catch { return undefined; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, host.clientWidth / host.clientHeight, 0.1, 100);
    camera.position.set(0, 2.8, 12.4);
    const rig = new THREE.Group();
    scene.add(rig);
    scene.add(new THREE.AmbientLight(0xa7c7b1, 1.35));
    const keyLight = new THREE.PointLight(0xe0f58a, 26, 24);
    keyLight.position.set(-4, 5, 5);
    scene.add(keyLight);
    const coolLight = new THREE.PointLight(0x7acbbb, 19, 22);
    coolLight.position.set(4, 1, -3);
    scene.add(coolLight);
    const floor = new THREE.GridHelper(20, 28, 0x456252, 0x2a443a);
    floor.position.y = -2.6;
    floor.material.transparent = true;
    floor.material.opacity = 0.42;
    rig.add(floor);

    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.82, 4), new THREE.MeshPhysicalMaterial({ color: 0xdaf58c, emissive: 0x829c45, emissiveIntensity: 0.75, metalness: 0.68, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.14 }));
    core.position.set(0, 0.35, 0);
    rig.add(core);
    const rings = [];
    [1.28, 1.54].forEach((radius, index) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, index ? 0.012 : 0.018, 8, 120), new THREE.MeshStandardMaterial({ color: index ? 0x73c9b7 : 0xd9f18b, emissive: index ? 0x1c6b5b : 0x516627, emissiveIntensity: 1.2, metalness: 0.62, roughness: 0.3, transparent: true, opacity: index ? 0.58 : 0.8 }));
      ring.position.copy(core.position);
      ring.rotation.set(index ? 1.04 : 0.5, index * 0.55, index ? 0.25 : -0.42);
      rig.add(ring);
      rings.push(ring);
    });

    const positions = [[-3.4, 0.8, -0.6], [-2.65, -0.82, 0.15], [-1.5, 1.52, -1.1], [1.85, 1.34, -0.8], [3.15, 0.52, -0.25], [2.6, -1.03, 0.4], [0.2, -1.75, -0.6], [-0.2, 1.96, -1.65]];
    const nodes = [];
    const materials = [
      new THREE.MeshPhysicalMaterial({ color: 0x80d4c4, emissive: 0x286d63, emissiveIntensity: 0.8, metalness: 0.55, roughness: 0.22, clearcoat: 0.85 }),
      new THREE.MeshPhysicalMaterial({ color: 0xef836f, emissive: 0x7f3329, emissiveIntensity: 0.92, metalness: 0.5, roughness: 0.26, clearcoat: 0.8 }),
      new THREE.MeshPhysicalMaterial({ color: 0xdaf58c, emissive: 0x53672d, emissiveIntensity: 0.72, metalness: 0.62, roughness: 0.2, clearcoat: 0.9 }),
    ];
    const corePoint = new THREE.Vector3(0, 0.35, 0);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x8fbd92, transparent: true, opacity: 0.34 });
    positions.forEach((position, index) => {
      const point = new THREE.Vector3(...position);
      const node = new THREE.Mesh(new THREE.SphereGeometry(index % 3 === 0 ? 0.16 : 0.11, 24, 16), materials[index % materials.length]);
      node.position.copy(point);
      rig.add(node);
      nodes.push(node);
      rig.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([point, corePoint]), lineMaterial));
      if (index < 5) {
        const color = index === 3 && openCount ? 0xed806d : 0x9bd7a9;
        const halo = new THREE.Mesh(new THREE.SphereGeometry(index % 3 === 0 ? 0.25 : 0.19, 20, 14), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.1 }));
        halo.position.copy(point);
        rig.add(halo);
      }
    });
    const particlePositions = new Float32Array(420 * 3);
    for (let i = 0; i < particlePositions.length; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 14;
      particlePositions[i + 1] = (Math.random() - 0.5) * 7;
      particlePositions[i + 2] = (Math.random() - 0.5) * 9 - 1;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: 0xd7eac0, size: 0.018, transparent: true, opacity: 0.52, sizeAttenuation: true }));
    rig.add(particles);

    const pointer = { x: 0, y: 0 };
    const onPointerMove = (event) => {
      const rect = host.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 0.5;
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 0.28;
    };
    host.addEventListener('pointermove', onPointerMove);
    const resizeObserver = new ResizeObserver(() => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    resizeObserver.observe(host);
    let frame = 0;
    let animationId = 0;
    const animate = () => {
      animationId = window.requestAnimationFrame(animate);
      const time = frame++ * 0.006;
      core.rotation.y = time * 0.35;
      core.rotation.x = Math.sin(time * 0.7) * 0.1;
      core.position.y = 0.35 + Math.sin(time * 0.8) * 0.07;
      rings[0].rotation.z += 0.0018;
      rings[1].rotation.x -= 0.0011;
      nodes.forEach((node, index) => { node.position.y = positions[index][1] + Math.sin(time + index) * 0.045; });
      particles.rotation.y = time * 0.025;
      rig.rotation.y += (pointer.x - rig.rotation.y) * 0.022;
      rig.rotation.x += (-pointer.y - rig.rotation.x) * 0.022;
      renderer.render(scene, camera);
    };
    animate();
    return () => {
      window.cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      host.removeEventListener('pointermove', onPointerMove);
      scene.traverse((object) => {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else object.material?.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [incidentCount, openCount]);

  return <div className="topology-canvas" ref={hostRef} />;
}

export default TopologyScene;