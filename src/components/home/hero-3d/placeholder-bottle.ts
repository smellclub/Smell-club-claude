import type * as THREE_NS from "three";

type Three = typeof THREE_NS;

/**
 * ⚠️ PLACEHOLDER — NO es el frasco de Liquid Brun.
 * Frasco genérico sin marca que se muestra mientras no exista
 * public/models/liquid-brun.glb. Se reemplaza automáticamente por el
 * modelo real (ver src/config/hero-model.ts).
 *
 * Devuelve un grupo con la base en y = 0 y 1 unidad de alto.
 */
export function createPlaceholderBottle(THREE: Three): THREE_NS.Group {
  const group = new THREE.Group();
  group.name = "hero-placeholder-bottle";

  const H = 0.66; // cuerpo
  const W = 0.46;
  const D = 0.2;
  const r = 0.05;

  const shape = new THREE.Shape();
  shape.moveTo(-W / 2 + r, 0);
  shape.lineTo(W / 2 - r, 0);
  shape.quadraticCurveTo(W / 2, 0, W / 2, r);
  shape.lineTo(W / 2, H - r);
  shape.quadraticCurveTo(W / 2, H, W / 2 - r, H);
  shape.lineTo(-W / 2 + r, H);
  shape.quadraticCurveTo(-W / 2, H, -W / 2, H - r);
  shape.lineTo(-W / 2, r);
  shape.quadraticCurveTo(-W / 2, 0, -W / 2 + r, 0);
  const bevel = 0.02;
  const bodyGeo = new THREE.ExtrudeGeometry(shape, {
    depth: D - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 5,
    curveSegments: 16,
  });
  bodyGeo.translate(0, 0, -(D - bevel * 2) / 2);

  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.04,
    transmission: 1,
    thickness: 0.25,
    ior: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.2,
  });
  group.add(new THREE.Mesh(bodyGeo, glass));

  // Líquido neutro (ámbar muy suave)
  const liquidGeo = new THREE.BoxGeometry(W - 0.07, H * 0.72, D - 0.07);
  liquidGeo.translate(0, H * 0.36 + 0.03, 0);
  const liquid = new THREE.Mesh(
    liquidGeo,
    new THREE.MeshPhysicalMaterial({
      color: 0xd9b27a,
      roughness: 0.2,
      transmission: 0.6,
      thickness: 0.2,
      ior: 1.33,
    }),
  );
  group.add(liquid);

  const metal = new THREE.MeshStandardMaterial({ color: 0xcfcfcf, metalness: 1, roughness: 0.25 });
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.05, 32), metal);
  collar.position.y = H + 0.025;
  group.add(collar);

  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.26, 0.14),
    new THREE.MeshPhysicalMaterial({ color: 0x151515, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 }),
  );
  cap.position.y = H + 0.05 + 0.13;
  group.add(cap);

  // Normaliza a 1 unidad de alto
  const box = new THREE.Box3().setFromObject(group);
  const height = box.max.y - box.min.y;
  group.scale.setScalar(1 / height);
  return group;
}
