const dgram = require('dgram');
const PORT = 38899;
const ADDR = '255.255.255.255';

const client = dgram.createSocket('udp4');
const message = Buffer.from('{"method":"getPilot","params":{}}');

client.bind(() => {
  client.setBroadcast(true);
  client.send(message, PORT, ADDR, (err) => {
    if (err) {
      console.error(err);
      client.close();
    } else {
      console.log('Message sent');
    }
  });
});

client.on('message', (msg, rinfo) => {
  console.log(`Received ${msg.length} bytes from ${rinfo.address}:${rinfo.port}`);
  console.log(msg.toString());
  client.close();
});

client.on('close', () => {
  console.log('Socket closed');
});
