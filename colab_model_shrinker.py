# =====================================================================
#  SARAS CITY — Model Shrinker (Google Colab, phone se bhi chal sakta hai)
#  Kaam: bade 3D models (FBX / OBJ / GLB, 100+ MB) ko chhota GLB bana deta hai
#        (triangles kam + textures chhoti), taake phone ke game mein chal sakein.
#
#  Kaise chalana hai:
#   1) colab.research.google.com kholo (Google account), "New notebook" banao.
#      (Phone par Chrome ke menu se "Desktop site" on karna behtar hai.)
#   2) Neeche har "# %% Cell" ke hisse ko ALAG ALAG cell mein paste karke chalao.
#   3) Cell 2 mein apni model file(s) select karo. FBX ke saath uski texture
#      images (jpg/png) bhi ek saath select karo, warna rang nahi aayenge.
#   4) Cell 3 ke aakhir mein *_small.glb download ho jayegi.
#
#  NOTE: ye script maine khud yahan chala kar test nahi ki (mere paas Blender nahi).
#        Agar error aaye to error ka text mujhe bhej do, mai theek kar dunga.
#  LICENCE: sirf wahi models shrink karo jinki licence game mein use ki ijazat deti ho.
# =====================================================================

# %% Cell 1 — Blender (bpy) install karo  (2-4 minute lagte hain)
# Neeche wali line ko cell mein aise hi paste karo (shuru mein ! ke saath):
# !pip -q install bpy

# %% Cell 2 — apni files upload karo
# from google.colab import files
# up = files.upload()
# print(list(up.keys()))

# %% Cell 3 — shrink + export
import os
import bpy

TARGET_TRIS = 6000   # gaari: 6000-10000 | chhoti cheez (fan, cart): 500-2000 | imaarat: 3000-8000
MAX_TEX     = 512    # texture ki sab se bari side (pixels). 512 phone ke liye kaafi hai
JPEG_Q      = 70     # texture quality (60-80 theek)


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def import_model(path):
    ext = os.path.splitext(path)[1].lower()
    if ext == '.fbx':
        try:
            bpy.ops.import_scene.fbx(filepath=path)
        except Exception:
            bpy.ops.preferences.addon_enable(module='io_scene_fbx')
            bpy.ops.import_scene.fbx(filepath=path)
    elif ext in ('.glb', '.gltf'):
        bpy.ops.import_scene.gltf(filepath=path)
    elif ext == '.obj':
        if hasattr(bpy.ops.wm, 'obj_import'):
            bpy.ops.wm.obj_import(filepath=path)
        else:
            bpy.ops.import_scene.obj(filepath=path)
    else:
        raise Exception('Is format ko nahi samajhta: ' + ext)


def mesh_objects():
    return [o for o in bpy.context.scene.objects if o.type == 'MESH']


def total_tris():
    n = 0
    for o in mesh_objects():
        o.data.calc_loop_triangles()
        n += len(o.data.loop_triangles)
    return n


def decimate_all(target):
    total = total_tris()
    if total <= target:
        print('Triangles pehle se kam hain:', total)
        return
    ratio = max(0.02, target / float(total))
    print('Triangles:', total, '-> lagbhag', int(total * ratio), '(ratio %.3f)' % ratio)
    for o in mesh_objects():
        try:
            bpy.context.view_layer.objects.active = o
            for other in bpy.context.scene.objects:
                other.select_set(False)
            o.select_set(True)
            mod = o.modifiers.new(name='shrink', type='DECIMATE')
            mod.ratio = ratio
            bpy.ops.object.modifier_apply(modifier=mod.name)
        except Exception as e:
            print('  decimate skip:', o.name, e)


def shrink_textures(max_side):
    for img in list(bpy.data.images):
        try:
            w, h = img.size
            if w > 0 and h > 0 and max(w, h) > max_side:
                s = max_side / float(max(w, h))
                img.scale(max(1, int(w * s)), max(1, int(h * s)))
        except Exception as e:
            print('  texture skip:', img.name, e)


def strip_extras():
    for o in list(bpy.context.scene.objects):
        if o.type in ('CAMERA', 'LIGHT'):
            bpy.data.objects.remove(o, do_unlink=True)


def export_glb(path):
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format='GLB',
        export_image_format='JPEG',
        export_jpeg_quality=JPEG_Q,
        export_apply=True,
        export_cameras=False,
        export_lights=False,
    )


MODEL_EXT = ('.fbx', '.obj', '.glb', '.gltf')
for name in list(up.keys()):                      # 'up' Cell 2 se aata hai
    if not name.lower().endswith(MODEL_EXT):
        continue
    print('\n===', name, '===')
    try:
        reset_scene()
        import_model(name)
        strip_extras()
        decimate_all(TARGET_TRIS)
        shrink_textures(MAX_TEX)
        out = os.path.splitext(name)[0] + '_small.glb'
        export_glb(out)
        mb = os.path.getsize(out) / 1024.0 / 1024.0
        print('Tayyar:', out, '| size: %.2f MB | triangles: %d' % (mb, total_tris()))
        if mb > 5:
            print('  (Abhi bhi 5 MB se bari hai: TARGET_TRIS aur MAX_TEX kam karke dobara chalao)')
        files.download(out)
    except Exception as e:
        print('Masla aaya:', e)
