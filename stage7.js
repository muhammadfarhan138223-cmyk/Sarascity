/* SARAS CITY — Pakistani Player Animation Fallback */
(function () {
  'use strict';

  const G = window.G;
  if (!G || !G.T) return;

  let player = null;
  let bones = [];
  let baseRot = [];

  function findPlayer() {
    if (!G.me || !G.me.mesh) return false;

    player = G.me.mesh;
    bones = [];
    baseRot = [];

    player.traverse(function (o) {
      if (o.isBone) {
        bones.push(o);

        baseRot.push({
          x: o.rotation.x,
          y: o.rotation.y,
          z: o.rotation.z
        });
      }
    });

    return true;
  }

  function animatePlayer() {
    if (!player || !player.parent) {
      findPlayer();
      return;
    }

    const speed = Number(G.footSpeed || 0);
    const moving = speed > 0.25;
    const time = performance.now() * 0.001;

    /*
      The current person.glb has a skeleton but no
      animation clips, so this provides a lightweight
      procedural animation until proper Mixamo animations
      are added.
    */

    const swing = moving
      ? Math.sin(time * Math.min(12, 4 + speed)) * 0.10
      : Math.sin(time * 1.8) * 0.012;

    for (let i = 0; i < bones.length; i++) {
      const b = bones[i];
      const base = baseRot[i];

      /* Always return to the original pose first */
      b.rotation.set(
        base.x,
        base.y,
        base.z
      );

      /* Then apply a small movement */
      if (moving) {
        if (i % 4 === 1) {
          b.rotation.x += swing;
        } else if (i % 4 === 2) {
          b.rotation.x -= swing;
        }
      } else {
        /* Small idle breathing motion */
        b.rotation.x += swing;
      }
    }
  }

  if (G.hooks && G.hooks.update) {
    G.hooks.update.push(animatePlayer);
  }

  if (G.hooks && G.hooks.ready) {
    G.hooks.ready.push(function () {
      setTimeout(findPlayer, 700);
    });
  }

})();
