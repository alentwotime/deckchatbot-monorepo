// Babylon.js scene setup: initialize on DOM load and expose renderDeck(width, depth)
window.addEventListener('DOMContentLoaded', function() {
  const canvas = document.getElementById('renderCanvas');
  if (!canvas || typeof BABYLON === 'undefined') return;
  const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
  const scene = new BABYLON.Scene(engine);
  let deckMesh;

  // Camera & lights
  const camera = new BABYLON.ArcRotateCamera(
    'camera',
    -Math.PI / 2,
    Math.PI / 3,
    20,
    new BABYLON.Vector3(0, 0, 0),
    scene
  );
  camera.attachControl(canvas, true);
  new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);

  // Render loop
  engine.runRenderLoop(() => scene.render());
  window.addEventListener('resize', () => engine.resize());

  // Clear old deck meshes & render a new deck box
  window.renderDeck = function(width, depth, height = 0.3) {
    if (deckMesh) deckMesh.dispose();
    deckMesh = BABYLON.MeshBuilder.CreateBox(
      'deckMesh',
      { width, height, depth },
      scene
    );
    deckMesh.position.y = height / 2;
  };

  // Capture an orthographic screenshot of the scene
  window.exportBlueprint = function() {
    const prevMode = camera.mode;
    camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
    BABYLON.Tools.CreateScreenshotUsingRenderTarget(engine, camera, {
      width: 800,
      height: 600,
    });
    camera.mode = prevMode;
  };

  // Download the scene as a GLB file
  window.exportGlb = async function() {
    const glb = await BABYLON.GLTF2Export.GLBAsync(scene, 'deck');
    glb.downloadFiles();
  };
});

