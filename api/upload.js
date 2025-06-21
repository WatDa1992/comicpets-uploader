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

  const form = new IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to parse file' });
    }

    const file = files.image || files.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const tempPath = file[0].filepath;
    const fileName = path.basename(tempPath);
    const publicPath = path.join(process.cwd(), 'public', 'uploads', fileName);

    await fs.promises.copyFile(tempPath, publicPath);

    const url = `https://${req.headers.host}/uploads/${fileName}`;
    res.status(200).json({ url });
  });
}
