import { Font } from '@jimp/plugin-print';
import JIMP from 'jimp';

/**
 * @author Édson Fischborn
 */

export type ImageInfo = {
  title: string;
  format: string;
  path: string;
};

enum AutoAlign {
  HCENTER = JIMP.HORIZONTAL_ALIGN_CENTER,
  HRIGHT = JIMP.HORIZONTAL_ALIGN_RIGHT,
  VCENTER = JIMP.VERTICAL_ALIGN_MIDDLE,
  VBOTTOM = JIMP.VERTICAL_ALIGN_BOTTOM,
}

export async function createSentenceImage(
  image: ImageInfo,
  sentence: string,
  author: string
) {
  const img = await JIMP.read(image.path);
  const font = await JIMP.loadFont(JIMP.FONT_SANS_32_WHITE);

  img
    .resize(500, JIMP.AUTO)
    .quality(50)
    .color([{ apply: 'shade', params: [10] }]);

  print(img, font, `- ${author}`, AutoAlign.HRIGHT, AutoAlign.VBOTTOM);
  print(img, font, `${sentence}`, AutoAlign.HCENTER, AutoAlign.VCENTER);

  return img.getBase64Async(JIMP.MIME_PNG);
}

function print(
  img: JIMP,
  font: Font,
  text: string,
  algnX: number,
  algnY: number
) {
  img.print(
    font,
    20,
    0,
    {
      text: text,
      alignmentX: algnX,
      alignmentY: algnY,
    },
    img.getWidth() - 40,
    img.getHeight() - 20
  );
}
