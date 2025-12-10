import { Storage } from '@google-cloud/storage';
import path from 'path';

const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,  
});

const bucket = storage.bucket(process.env.GCLOUD_BUCKET_NAME!);

export const uploadFile = async (file: File, gameName: string, relativePath: string) => {
  const buffer = Buffer.from(await file.arrayBuffer());
  // Structure: games/game-name/assets/image.png
  const destination = `games/${gameName}/${relativePath}`;
  
  const blob = bucket.file(destination);
  await blob.save(buffer, {
    contentType: file.type,
    resumable: false 
  });
  
  return destination;
};

export const listGames = async () => {
  // We list folders by looking for unique prefixes in the 'games/' directory
  const [files] = await bucket.getFiles({ prefix: 'games/', delimiter: '/' });
  // Note: GCS is flat, 'folders' are simulated via prefixes. 
  // Getting "folders" usually requires using the getFiles response's apiResponse.prefixes
  // For simplicity, we will just list all files and extract unique game names, 
  // or store metadata in a separate DB. 
  // Here is a simple implementation assuming directory structure:
  
  // A more robust way requires using the `prefixes` returned from the API, 
  // but the Node SDK wraps this. Let's try a distinct map strategy for simplicity:
  const gameNames = new Set();
  files.forEach(file => {
    const parts = file.name.split('/');
    if (parts[1]) gameNames.add(parts[1]);
  });
  return Array.from(gameNames);
};

export const getFileStream = (path: string) => {
  return bucket.file(path).createReadStream();
};

export const deleteGame = async (gameName: string) => {
  await bucket.deleteFiles({ prefix: `games/${gameName}/` });
};