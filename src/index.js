import cv from 'opencv';
import Koa from 'koa';
import serve from 'koa-static';
import http from 'http';
import socketio from 'socket.io';

const app = new Koa();
const server = http.createServer(app.callback());

//app.use(serve('/'));
const BLUE = [0, 255, 0]; // B, G, R
const RED = [0, 0, 255]; // B, G, R
const GREEN = [0, 255, 0]; // B, G, R
const WHITE = [255, 255, 255]; // B, G, R
const thickness = 2; // default 1
const lowThresh = 0;
const highThresh = 100;
const nIters = 2;
const minArea = 2000;

let camera;

app.listen(3000);

const io = socketio(server);
server.listen(3090);

io.on('connection', (socket) => {
  console.log('connection!');
  socket.emit('msg', 'hello from the socket!');
  try {
    if (!camera) {
      camera = new cv.VideoCapture(0);
    }
    // const out = new cv.Matrix(HEIGHT, WIDTH);

    setInterval(() => {
      camera.read((err, im) => {
        if (err) {
          throw err;
        }

        const [WIDTH, HEIGHT] = im.size();

        if (WIDTH > 0 && HEIGHT > 0) {
          const out = im.copy();

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

          // face detection
          im.detectObject(cv.FACE_CASCADE, {}, (err2, faces) => {
            if (err2) {
              throw err2;
            }
            if (faces.length > 0) {
              for (let i = 0; i < faces.length; i++) {
                const face = faces[i];
                out.rectangle([face.x, face.y], [face.width, face.height], BLUE, 2);
              }
            }

             socket.emit('frame', { buffer: out.toBuffer() });
          });
        }
      });
    }, 100);
  }
  catch (e) {
    console.log('Couldn\'t start camera:', e);
  }
});
