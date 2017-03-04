import cv from 'opencv';
import Koa from 'koa';
import serve from 'koa-static';
import http from 'http';
import socketio from 'socket.io';

const app = new Koa();
const server = http.createServer(app.callback());

// app.use(serve('/'));

let camera;

app.listen(3000);

let timer;
const io = socketio(server);
server.listen(3090);

io.on('disconnect', () => {
  clearInterval(timer);
});

io.on('connection', (socket) => {
  console.log('connection!');
  socket.emit('msg', 'hello from the socket!');
  try {
    if (!camera) {
      camera = new cv.VideoCapture(0);
    }

    timer = setInterval(() => {
      camera.read((err, im) => {
        if (err) {
          throw err;
        }

        const [WIDTH, HEIGHT] = im.size();

        if (WIDTH > 0 && HEIGHT > 0) {

          // face detection
          im.detectObject(cv.FACE_CASCADE, {}, (err2, faces) => {
            if (err2) {
              throw err2;
            }

            let out = new cv.Matrix(HEIGHT, WIDTH);
            let face = { x: 0, y: 0, width: 0, height: 0 };

            if (faces.length > 0) {
              face = faces[0];
              out = im.roi(face.x, face.y, face.width, face.height);
            }
            if (out && face) {
              socket.emit('frame', {
                position: { x: face.x / WIDTH, y: face.y / HEIGHT },
                size: { width: face.width / WIDTH, height: face.height / HEIGHT },
                buffer: out.toBuffer()
              });
            }
          });
        }
      });
    }, 100);
  }
  catch (e) {
    console.log('Couldn\'t start camera:', e);
  }
});
