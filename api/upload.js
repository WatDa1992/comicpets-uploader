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
      console.error('Parse error:', err);
      return res.status(500).json({ error: 'Failed to parse file' });
    }

    const file = files.image || files.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const tempPath = file[0].filepath;
      const fileName = path.basename(tempPath);
      const destination = path.join(process.cwd(), 'public', 'uploads', fileName);

      await fs.promises.copyFile(tempPath, destination);

      const url = `https://${req.headers.host}/uploads/${fileName}`;
      return res.status(200).json({ url });

    } catch (copyError) {
      console.error('File copy error:', copyError);
      return res.status(500).json({ error: 'Failed to save file' });
    }
  });
}
