const compareImages = require('../compareImages');
const fs = require('fs');

describe('compareImages', () => {
  test('works with buffers', async () => {
    const data = await compareImages(
      fs.readFileSync('./demoassets/People.jpg'),
      fs.readFileSync('./demoassets/People2.jpg')
    );

    expect(data.isSameDimensions).toBe(true);
    expect(data.misMatchPercentage).toEqual('8.66');

    const buffer = data.getBuffer();

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBe(91876);

    const comparison = fs.readFileSync(
      './nodejs-tests/PeopleComparedToPeople2.png'
    );

    expect(buffer.equals(comparison)).toBe(true);
  });

  test('throws when failed', async () => {
    const promise = compareImages(
      fs.readFileSync('./demoassets/People.jpg'),
      'bogus data'
    );
    await expect(promise).rejects.toMatch('Image load error.');
  });
});
