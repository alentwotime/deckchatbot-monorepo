// frontend/src/utils/canvasHelpers.js

export function drawOverlay(ctx, width, height, squareFootage) {
  // Optional: clear canvas before drawing
  ctx.clearRect(0, 0, width, height);

  // Overlay background box
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(10, 10, 300, 40);

  // Overlay text
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText(`Estimated SqFt: ${squareFootage}`, 20, 38);
}

export function drawPreviewImage(img, canvas, squareFootage) {
  const ctx = canvas.getContext("2d");

  canvas.width = img.width;
  canvas.height = img.height;

  ctx.drawImage(img, 0, 0);

  if (squareFootage) {
    drawOverlay(ctx, img.width, img.height, squareFootage);
  }
}
