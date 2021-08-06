import { readdirSync } from 'fs';
import { resolve } from 'path';
import qrcodeTerminal from 'qrcode-terminal';
import WAWebJS, { Client, Message, MessageMedia } from 'whatsapp-web.js';

import { createSentenceImage, ImageInfo } from './createSentenceImage';

/**
 * @author Édson Fischborn
 */
export default class WhatsappSentenceBot {
  public allowedContacts: string[];

  private _allowedContacts: WAWebJS.Contact[];
  private images: ImageInfo[];

  private client = new Client({});
  private qrcodeHandler = qrcodeTerminal;

  constructor(contacts: string[]) {
    this.images = this.getImages();
    this.allowedContacts = contacts;
    this._allowedContacts = [];

    this.start();
  }

  private start = async () => {
    this.setCallbacks();

    await this.client.initialize();
    await this.setAllowedContacts();
  };

  private setCallbacks = () => {
    this.client.on('qr', this.onQr);
    this.client.on('ready', this.onReady);
    this.client.on('message', this.onMessage);
  };

  private onQr = (qrString: string) => {
    this.qrcodeHandler.generate(qrString, { small: true });
  };

  private onReady = () => {
    console.log('Conectado com sucesso!');
  };

  private setAllowedContacts = async () => {
    const allowedContacts = await this.client.getContacts();

    this._allowedContacts = allowedContacts.filter((contact) => {
      const allowed = this.allowedContacts.find(
        (c) => c.toLocaleLowerCase() === contact.name?.toLocaleLowerCase()
      );

      return (contact.isMyContact || contact.isGroup) && !!allowed;
    });
  };

  private onMessage = async (message: Message) => {
    await this.showReceivedMessage(message).catch(() =>
      console.log('Talvez você tenha novas mensagens')
    );

    await this.replyWithSentenceImage(message).catch(() =>
      console.log('Falha ao responder com imagem')
    );
  };

  private showReceivedMessage = async (message: Message) => {
    const chat = await message.getChat();

    if (chat.isGroup) {
      console.log(`${chat.name} - grupo: ${message.body}`);
    } else {
      console.log(`${chat.name} - pv: ${message.body}`);
    }
  };

  private replyWithSentenceImage = async (message: Message) => {
    const allowedChars = ['"', '“', '”', "'"];
    let msg = message.body;

    if (
      allowedChars.includes(msg[0]) &&
      allowedChars.includes(msg[msg.length - 1])
    ) {
      msg = `"${msg.substring(1).slice(0, -1)}"`;
    } else {
      return;
    }

    if (this._allowedContacts.find((c) => c.id._serialized === message.from)) {
      const [data, base64] = (await this.getSentenceImage(msg)).split(',');
      const mime = data.split(';')[0].substring(5);
      const media = new MessageMedia(mime, base64);

      message.reply(media);
    }
  };

  private getSentenceImage = (text: string, images = this.images) => {
    const font = resolve('src', 'assets', 'fonts', 'yellow.fnt');
    const index = Math.floor(Math.random() * images.length);

    if (text.length > 200) text = `${text.slice(0, 197)}..."`;

    let author = '';
    try {
      author = this.images[index].title.split('-').join(' ');
    } catch (err) {
      author = this.images[index].title;
    }

    return createSentenceImage(this.images[index], text, author, font);
  };

  private getImages = () => {
    const images: ImageInfo[] = [];

    readdirSync(resolve('src', 'assets', 'peoples-images')).forEach((file) => {
      const path = resolve('src', 'assets', 'peoples-images', file);
      const [title, format] = file.split('.');

      images.push({
        title,
        format,
        path,
      });
    });

    return images;
  };
}
