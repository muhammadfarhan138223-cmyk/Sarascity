/* SARAS CITY — Pakistani Character Outfit */
(function () {
  'use strict';

  const G = window.G;
  if (!G || !G.T) return;

  const T = G.T;
  let player = null;
  let outfit = null;

  function createOutfit() {
    if (!G.me || !G.me.mesh) return;

    player = G.me.mesh;

    if (outfit) return;

    outfit = new T.Group();
    outfit.name = 'PakistaniShalwarKameez';

    /*
      Approximate Pakistani shalwar-kameez
      built from lightweight Three.js geometry.
    */

    // Kameez
    const kameezMat = new T.MeshStandardMaterial({
      color: 0xe8e1d2,
      roughness: 0.85,
      metalness: 0
    });

    const kameez = new T.Mesh(
      new T.CylinderGeometry(0.31, 0.38, 0.82, 16),
      kameezMat
    );

    kameez.position.y = 0.05;
    outfit.add(kameez);

    // Shalwar
    const shalwarMat = new T.MeshStandardMaterial({
      color: 0xd8d0c0,
      roughness: 0.9,
      metalness: 0
    });

    const shalwar = new T.Mesh(
      new T.CylinderGeometry(0.30, 0.43, 0.65, 16),
      shalwarMat
    );

    shalwar.position.y = -0.67;
    outfit.add(shalwar);

    // Kameez collar
    const collarMat = new T.MeshStandardMaterial({
      color: 0xcfc5b2,
      roughness: 0.8
    });

    const collar = new T.Mesh(
      new T.TorusGeometry(0.105, 0.018, 6, 16),
      collarMat
    );

    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.47;
    outfit.add(collar);

    // Waistcoat
    const waistcoatMat = new T.MeshStandardMaterial({
      color: 0x263746,
      roughness: 0.8,
      metalness: 0
    });

    const waistcoat = new T.Mesh(
      new T.BoxGeometry(0.42, 0.58, 0.16),
      waistcoatMat
    );

    waistcoat.position.set(0, 0.08, 0.27);
    outfit.add(waistcoat);

    // Small buttons
    const buttonMat = new T.MeshStandardMaterial({
      color: 0xc9a34a,
      metalness: 0.45,
      roughness: 0.35
    });

    for (let i = 0; i < 3; i++) {
      const button = new T.Mesh(
        new T.SphereGeometry(0.018, 8, 8),
        buttonMat
      );

      button.position.set(
        0,
        0.27 - i * 0.09,
        0.365
      );

      outfit.add(button);
    }

    player.add(outfit);
  }

  function updateOutfit() {
    if (!outfit) {
      createOutfit();
      return;
    }

    // Keep outfit aligned with the player.
    outfit.rotation.set(0, 0, 0);
  }

  if (G.hooks && G.hooks.ready) {
    G.hooks.ready.push(function () {
      setTimeout(createOutfit, 1200);
    });
  }

  if (G.hooks && G.hooks.update) {
    G.hooks.update.push(updateOutfit);
  }

})();
