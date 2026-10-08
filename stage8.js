/* SARAS CITY — Pakistani Character Outfit v2 */
(function () {
  'use strict';

  const G = window.G;
  if (!G || !G.T) return;

  const T = G.T;

  let outfit = null;
  let characterWrap = null;

  function findCharacterWrap() {
    if (!G.me || !G.me.mesh) return null;

    const root = G.me.mesh;

    /*
      stage4.js puts the real person.glb inside
      a Group after loading and normalizing it.
    */

    for (const child of root.children) {
      let hasMesh = false;

      child.traverse(function (o) {
        if (o.isMesh) hasMesh = true;
      });

      if (hasMesh) return child;
    }

    return null;
  }

  function makeMaterial(color) {
    return new T.MeshStandardMaterial({
      color: color,
      roughness: 0.85,
      metalness: 0
    });
  }

  function createOutfit() {
    characterWrap = findCharacterWrap();

    if (!characterWrap || outfit) return false;

    const box = new T.Box3().setFromObject(characterWrap);
    const size = new T.Vector3();
    const center = new T.Vector3();

    box.getSize(size);
    box.getCenter(center);

    const h = size.y;

    /*
      Character is normalized by stage4.js to about 1.8m.
      Use its actual bounding box so clothing follows
      the real model instead of guessing coordinates.
    */

    const outfitRoot = new T.Group();
    outfitRoot.name = 'PakistaniShalwarKameez';
    outfitRoot.position.set(0, 0, 0);

    /* ---------- KAMEEZ ---------- */

    const kameezMat = makeMaterial(0xe8e1d2);

    const kameez = new T.Mesh(
      new T.CylinderGeometry(
        size.x * 0.22,
        size.x * 0.34,
        h * 0.42,
        20
      ),
      kameezMat
    );

    kameez.position.set(
      0,
      h * 0.57,
      0
    );

    outfitRoot.add(kameez);

    /* ---------- SHALWAR ---------- */

    const shalwarMat = makeMaterial(0xd7cfbd);

    const shalwar = new T.Mesh(
      new T.CylinderGeometry(
        size.x * 0.30,
        size.x * 0.39,
        h * 0.34,
        20
      ),
      shalwarMat
    );

    shalwar.position.set(
      0,
      h * 0.28,
      0
    );

    outfitRoot.add(shalwar);

    /* ---------- WAISTCOAT ---------- */

    const waistcoatMat = makeMaterial(0x263746);

    const waistcoat = new T.Mesh(
      new T.BoxGeometry(
        size.x * 0.48,
        h * 0.30,
        size.z * 0.18
      ),
      waistcoatMat
    );

    waistcoat.position.set(
      0,
      h * 0.59,
      size.z * 0.13
    );

    outfitRoot.add(waistcoat);

    /* ---------- COLLAR ---------- */

    const collarMat = makeMaterial(0xc8bda9);

    const collar = new T.Mesh(
      new T.TorusGeometry(
        size.x * 0.10,
        size.x * 0.018,
        8,
        20
      ),
      collarMat
    );

    collar.rotation.x = Math.PI / 2;

    collar.position.set(
      0,
      h * 0.78,
      size.z * 0.18
    );

    outfitRoot.add(collar);

    /* ---------- BUTTONS ---------- */

    const buttonMat = new T.MeshStandardMaterial({
      color: 0xc9a34a,
      metalness: 0.35,
      roughness: 0.4
    });

    for (let i = 0; i < 3; i++) {
      const button = new T.Mesh(
        new T.SphereGeometry(size.x * 0.018, 8, 8),
        buttonMat
      );

      button.position.set(
        0,
        h * 0.70 - i * h * 0.065,
        size.z * 0.23
      );

      outfitRoot.add(button);
    }

    /* ---------- SLEEVES ---------- */

    const sleeveMat = makeMaterial(0xe8e1d2);

    for (const side of [-1, 1]) {
      const sleeve = new T.Mesh(
        new T.CylinderGeometry(
          size.x * 0.075,
          size.x * 0.09,
          h * 0.28,
          12
        ),
        sleeveMat
      );

      sleeve.rotation.z = side * Math.PI / 2.4;

      sleeve.position.set(
        side * size.x * 0.30,
        h * 0.60,
        0
      );

      outfitRoot.add(sleeve);
    }

    /*
      Keep clothing above the character mesh.
    */
    outfitRoot.traverse(function (o) {
      if (o.isMesh) {
        o.castShadow = true;
        o.renderOrder = 5;
      }
    });

    characterWrap.add(outfitRoot);

    outfit = outfitRoot;

    console.log('Pakistani outfit attached');

    if (G.toast) {
      G.toast('Pakistani outfit loaded', 1800);
    }

    return true;
  }

  function update() {
    if (!outfit) {
      createOutfit();
    }
  }

  if (G.hooks && G.hooks.update) {
    G.hooks.update.push(update);
  }

  if (G.hooks && G.hooks.ready) {
    G.hooks.ready.push(function () {
      setTimeout(createOutfit, 1800);
    });
  }

})();
