const Jimp = require('jimp');
const path = require('path');

async function testCert() {
  const templatePath = path.join(__dirname, '../frontend/public/All.png');
  const image = await Jimp.read(templatePath);

  const fontLarge = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);  // 64px
  const fontMed = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);    // 32px

  const width = image.bitmap.width;   // 2000
  const height = image.bitmap.height; // 1414

  // Transparent layers
  const nameLayer   = new Jimp(width, height, 0x00000000); // Student Name (blue)
  const prefixLayer = new Jimp(width, height, 0x00000000); // "has successfully earned the" (dark)
  const badgeLayer  = new Jimp(width, height, 0x00000000); // Badge Name (gold)
  const suffixLayer = new Jimp(width, height, 0x00000000); // achievement desc (dark)

  const printBold = (layer, font, x, y, opts, boxW) => {
    layer.print(font, x, y, opts, boxW);
    layer.print(font, x + 1, y, opts, boxW);
    layer.print(font, x, y + 1, opts, boxW);
  };

  const studentName   = "Muhammad Saad";
  const badgeName     = "Gold Learner Badge";
  const achievementDesc = "in recognition of completing 30 educational video lessons and\ndemonstrating commitment to continuous learning on Calculus Corner.";

  // 1. Student Name — centered, Y=490, blue
  printBold(nameLayer, fontLarge, 350, 650, {
    text: studentName,
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
  }, 1300);

  // 2. "has successfully earned the" — centered, Y=600, dark navy
  printBold(prefixLayer, fontMed, 350, 750, {
    text: 'has successfully earned the',
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
  }, 1300);

  // 3. Badge Name — centered, Y=650, gold accent
  printBold(badgeLayer, fontLarge, 350, 810, {
    text: badgeName,
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
  }, 1300);

  // 4. Achievement description — centered, Y=740, dark navy
  printBold(suffixLayer, fontMed, 550, 930, {
    text: achievementDesc,
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
  }, 1300);

  // ── Colorize layers ──

  // Student Name → vibrant blue #2761f0
  nameLayer.scan(0, 0, nameLayer.bitmap.width, nameLayer.bitmap.height, function (x, y, idx) {
    if (this.bitmap.data[idx + 3] > 10) {
      this.bitmap.data[idx]     = 39;
      this.bitmap.data[idx + 1] = 97;
      this.bitmap.data[idx + 2] = 240;
    }
  });

  // Prefix text → dark navy #1e293b
  prefixLayer.scan(0, 0, prefixLayer.bitmap.width, prefixLayer.bitmap.height, function (x, y, idx) {
    if (this.bitmap.data[idx + 3] > 10) {
      this.bitmap.data[idx]     = 30;
      this.bitmap.data[idx + 1] = 41;
      this.bitmap.data[idx + 2] = 59;
    }
  });

  // Badge Name → gold #D4981A (RGB: 212, 152, 26)
  badgeLayer.scan(0, 0, badgeLayer.bitmap.width, badgeLayer.bitmap.height, function (x, y, idx) {
    if (this.bitmap.data[idx + 3] > 10) {
      this.bitmap.data[idx]     = 212;
      this.bitmap.data[idx + 1] = 152;
      this.bitmap.data[idx + 2] = 26;
    }
  });

  // Suffix text → dark navy #1e293b
  suffixLayer.scan(0, 0, suffixLayer.bitmap.width, suffixLayer.bitmap.height, function (x, y, idx) {
    if (this.bitmap.data[idx + 3] > 10) {
      this.bitmap.data[idx]     = 30;
      this.bitmap.data[idx + 1] = 41;
      this.bitmap.data[idx + 2] = 59;
    }
  });

  // Composite all layers
  image.composite(nameLayer, 0, 0);
  image.composite(prefixLayer, 0, 0);
  image.composite(badgeLayer, 0, 0);
  image.composite(suffixLayer, 0, 0);

  await image.writeAsync(path.join(__dirname, '../frontend/public/test_out.png'));
  console.log('Saved test_out.png with multi-color text!');
}

testCert();
