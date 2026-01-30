import { promises as fs } from 'fs';
import path from 'path';

export class FileStorage {
  constructor(private basePath: string) {}

  async save(
    dataRoomId: string,
    fileId: string,
    versionId: string,
    filename: string,
    content: Buffer
  ): Promise<string> {
    const dir = path.join(this.basePath, dataRoomId, fileId, versionId);
    await fs.mkdir(dir, { recursive: true });

    const filePath = path.join(dir, filename);
    await fs.writeFile(filePath, content);

    return filePath;
  }

  async read(filePath: string): Promise<Buffer> {
    return fs.readFile(filePath);
  }

  async delete(filePath: string): Promise<void> {
    await fs.unlink(filePath);
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
