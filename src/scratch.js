const BLUE = [0, 255, 0]; // B, G, R
const RED = [0, 0, 255]; // B, G, R
const GREEN = [0, 255, 0]; // B, G, R
const WHITE = [255, 255, 255]; // B, G, R
const thickness = 2; // default 1
const lowThresh = 0;
const highThresh = 100;
const nIters = 2;
const minArea = 2000;

const bgsub = cv.BackgroundSubtractor.createMOG();
bgsub.applyMOG(im, (err, im2) => {
  console.log('error', err)
  console.log('applied to', im2)
});

// contour detection
const contourIm = im.copy();
contourIm.convertGrayscale();
contourIm.canny(lowThresh, highThresh);
contourIm.dilate(nIters);
const contours = contourIm.findContours();

for (let i = 0; i < contours.size(); i++) {
  if (contours.area(i) < minArea) {
    continue;
  }

  const arcLength = contours.arcLength(i, true);
  contours.approxPolyDP(i, 0.01 * arcLength, true);
  switch(contours.cornerCount(i)) {
    case 3:
      out.drawContour(contours, i, GREEN);
      break;
    case 4:
      out.drawContour(contours, i, RED);
      break;
    default:
      out.drawContour(contours, i, WHITE);
  }
}
