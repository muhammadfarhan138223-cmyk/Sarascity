/* SARAS CITY — Pakistani Player Animation Fallback */
(function () {
  'use strict';

  const G = window.G;
  if (!G || !G.T) return;

  const T = G.T;
  let player = null;
  let bones = [];
  let t = 0;

  function findPlayer() {
    if (!G.me || !G.me.mesh) return false;

    player = G.me.mesh;
    bones = [];

    player.traverse(o => {
      if (o.isBone) bones.push(o);
    });

    return true;
  }

  function animatePlayer(dt) {
    if (!player || !player.parent) {
      findPlayer();
      return;
    }

    t += dt;

    const speed = Number(G.footSpeed || 0);
    const moving = speed > 0.25;

    /*
      The downloaded character has a skeleton but no animation clips.
      This gives it a lightweight procedural game animation until
      proper Mixamo clips are added.
    */

    const bob =
      moving
        ? Math.sin(t * Math.min(14, 5 + speed * 1.4)) * 0.018
        : Math.sin(t * 2.2) * 0.006;

    player.position.y += bob;

    if (bones.length) {
      const swing =
        moving
          ? Math.sin(t * Math.min(12, 4 + speed)) * 0.18
          : Math.sin(t * 1.8) * 0.025;

      for (let i = 0; i < bones.length; i++) {
        const b = bones[i];

        if (i % 4 === 1) {
          b.rotation.x += swing * 0.15;
        } else if (i % 4 === 2) {
          b.rotation.x -= swing * 0.12;
        }
      }
    }
  }

  if (G.hooks && G.hooks.update) {
    G.hooks.update.push(animatePlayer);
  }

  if (G.hooks && G.hooks.ready) {
    G.hooks.ready.push(() => {
      setTimeout(findPlayer, 700);
    });
  }
})();
