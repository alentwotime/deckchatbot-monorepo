const { Scene, PerspectiveCamera, WebGLRenderer, BoxGeometry, MeshBasicMaterial, Mesh } = require('three');

async function create3DModel(measurements) {
  try {
    const scene = new Scene();
    const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    const deckGeometry = new BoxGeometry(measurements.width, measurements.length, measurements.height || 0.5);
    const deckMaterial = new MeshBasicMaterial({ color: 0x00ff00 });
    const deckMesh = new Mesh(deckGeometry, deckMaterial);

    scene.add(deckMesh);
    camera.position.z = 5;

    renderer.render(scene, camera);

    return { scene, camera, renderer }; // Return the 3D model components
  } catch (error) {
    console.error('Error creating 3D model:', error);
    throw new Error('Failed to create 3D model');
  }
}

module.exports = { create3DModel };