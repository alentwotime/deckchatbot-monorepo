// Babylon.js scene setup: initialize on DOM load and expose renderDeck(width, depth)
window.addEventListener('DOMContentLoaded', function() {
  const canvas = document.getElementById('renderCanvas');
  if (!canvas || typeof BABYLON === 'undefined') return;
  const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
  const scene = new BABYLON.Scene(engine);
  // Camera & lights
  const camera = new BABYLON.ArcRotateCamera('camera', -Math.PI/2, Math.PI/3, 20, new BABYLON.Vector3(0, 0, 0), scene);
  camera.attachControl(canvas, true);
  new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);

  // Render loop
  engine.runRenderLoop(() => scene.render());
  window.addEventListener('resize', () => engine.resize());

  // Clear old deck meshes & render a new deck box
  window.renderDeck = function(width, depth, height = 0.3) {
    scene.meshes
      .filter(m => m.name.startsWith('deckMesh'))
      .forEach(m => m.dispose());
    const deck = BABYLON.MeshBuilder.CreateBox(
      'deckMesh', { width, height, depth }, scene
    );
    deck.position.y = height / 2;
  };
});