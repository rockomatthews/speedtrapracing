const { addHat } = require('../src/lib/addHat');

const runAddHat = async () => {
  try {
    const hatId = await addHat();
    console.log('Successfully added hat with ID:', hatId);
    process.exit(0);
  } catch (error) {
    console.error('Failed to add hat:', error);
    process.exit(1);
  }
};

runAddHat();