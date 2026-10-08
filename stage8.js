/* SARAS CITY — Pakistani Character Outfit v3 */
(function () {
  'use strict';

  const G = window.G;
  if (!G || !G.T) return;

  const T = G.T;
  let done = false;

  function build() {
    if (done || !G.me || !G.me.mesh) return;

    const root = G.me.mesh;

    // Don't build twice
    if (root.getObjectByName('PAKISTANI_OUTFIT')) {
      done = true;
      return;
    }

    // Find visible character meshes and calculate bounds
    const box = new T.Box3();
    let found = false;

    root.traverse(function (o) {
      if (o.isMesh && o.visible) {
        box.expandByObject(o);
        found = true;
      }
    });

    if (!found) return;

    const size = new T.Vector3();
    const center = new T.Vector3();

    box.getSize(size);
    box.getCenter(center);

    if (size.y < 0.2) return;

    const H = size.y;
    const W = Math.max(size.x, 0.4);
    const D = Math.max(size.z, 0.25);

    const outfit = new T.Group();
    outfit.name = 'PAKISTANI_OUTFIT';

    // Move outfit to character's actual local center
    outfit.position.set(
      center.x,
      0,
      center.z
    );

    // KAMEEZ
    const kameez = new T.Mesh(
      new T.CylinderGeometry(
        W * 0.30,
        W * 0.40,
        H * 0.48,
        16
      ),
      new T.MeshStandardMaterial({
        color: 0xf0eadc,
        roughness: 0.9
      })
    );

    kameez.position.y = box.min.y + H * 0.55;
    outfit.add(kameez);

    // SHALWAR
    const shalwar = new T.Mesh(
      new T.CylinderGeometry(
        W * 0.34,
        W * 0.45,
        H * 0.34,
        16
      ),
      new T.MeshStandardMaterial({
        color: 0xd8d0bf,
        roughness: 0.95
      })
    );

    shalwar.position.y = box.min.y + H * 0.28;
    outfit.add(shalwar);

    // WAISTCOAT
    const waistcoat = new T.Mesh(
      new T.BoxGeometry(
        W * 0.55,
        H * 0.30,
        D * 0.75
      ),
      new T.MeshStandardMaterial({
        color: 0x263746,
        roughness: 0.85
      })
    );

    waistcoat.position.set(
      0,
      box.min.y + H * 0.62,
      D * 0.30
    );

    outfit.add(waistcoat);

    // COLLAR
    const collar = new T.Mesh(
      new T.TorusGeometry(
        W * 0.105,
        W * 0.018,
        8,
        16
      ),
      new T.MeshStandardMaterial({
        color: 0xc8bda9,
        roughness: 0.8
      })
    );

    collar.rotation.x = Math.PI / 2;
    collar.position.set(
      0,
      box.min.y + H * 0.79,
      D * 0.30
    );

    outfit.add(collar);

    // BUTTONS
    const gold = new T.MeshStandardMaterial({
      color: 0xd1a84b,
      metalness: 0.35,
      roughness: 0.4
    });

    for (let i = 0; i < 3; i++) {
      const b = new T.Mesh(
        new T.SphereGeometry(W * 0.022, 8, 8),
        gold
      );

      b.position.set(
        0,
        box.min.y + H * (0.72 - i * 0.065),
        D * 0.48
      );

      outfit.add(b);
    }

    // Make clothing render on top
    outfit.traverse(function (o) {
      if (o.isMesh) {
        o.renderOrder = 100;
        o.frustumCulled = false;
      }
    });

    root.add(outfit);

    done = true;

    console.log('SARAS: Pakistani outfit attached');
  }

  // Don't depend on G.hooks.
  // Check directly until the player exists.
  const timer = setInterval(function () {
    try {
      build();

      if (done) {
        clearInterval(timer);
      }
    } catch (e) {
      console.warn('Pakistani outfit:', e);
    }
  }, 500);

})();
