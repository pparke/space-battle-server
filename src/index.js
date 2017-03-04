import cv from 'opencv';
import Koa from 'koa';
import serve from 'koa-static';
import http from 'http';
import socketio from 'socket.io';

const app = new Koa();
const server = http.createServer(app.callback());
//app.use(serve('/'));

app.listen(3000);

const io = socketio(server);
server.listen(3090);

io.on('connection', (socket) => {
  console.log('connection!');
  socket.emit('msg', 'hello from the socket!');
  try {
    const camera = new cv.VideoCapture(0);
    // const window = new cv.NamedWindow('Video', 0);

    setInterval(() => {
      camera.read((err, im) => {
        if (err) {
          throw err;
        }
        if (im.size()[0] > 0 && im.size()[1] > 0) {

          im.detectObject(cv.FACE_CASCADE, {}, (err2, faces) => {
            if (err) {
              throw err;
            }
            if (faces.length === 0) {
              return console.log('No faces');
            }
            for (let i = 0; i < faces.length; i++) {
               let face = faces[i];
               im.rectangle([face.x, face.y], [face.width, face.height], COLOR, 2);
             }
          });
          // window.show(im);
          socket.emit('frame', { buffer: im.toBuffer() });
        }
        // window.blockingWaitKey(0, 50);
      });
    }, 10);
  }
  catch (e) {
    console.log('Couldn\'t start camera:', e);
  }
});
