const { discover, SCENES } = require('../lib/mod');

async function ping() {
  const bulbs = await discover({});

  const bulb = bulbs[0];

  if (!bulb) {
    console.log('No bulb found');
    process.exit(1);
  }

  console.log('Bulb found:', bulb);
}

ping();
