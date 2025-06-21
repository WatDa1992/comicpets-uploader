import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const form = new IncomingForm({ keepExtensions: true, uploadDir: '/tmp' });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'File parse failed' });
    }

    const file = files?.file || files?.image || Object.values(files)[0];
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const tempPath = file.filepath;
    const fileName = path.basename(tempPath);
    const publicPath = path.join(process.cwd(), 'public', 'uploads', fileName);

    try {
      // Stream from /tmp to public/uploads
      await new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(tempPath);
        const writeStream = fs.createWriteStream(publicPath);
        readStream.pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
    } catch (streamErr) {
      return res.status(500).json({ error: 'Stream failed', details: streamErr.message });
    }

    const url = `https://${req.headers.host}/uploads/${fileName}`;
    return res.status(200).json({ url });
  });
}
