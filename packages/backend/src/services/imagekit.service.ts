import ImageKit from 'imagekit';
import { env } from '../config/env.zod.js';

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/your_app_name',
});

export class ImageKitService {
  // Upload image to ImageKit
  static async uploadImage(file: Buffer | string, fileName: string, folder: string = 'courses'): Promise<string> {
    try {
      const result = await imagekit.upload({
        file: file, // base64 or buffer
        fileName: fileName,
        folder: folder,
        useUniqueFileName: true,
      });
      
      return result.url;
    } catch (error) {
      console.error('ImageKit upload error:', error);
      throw new Error('Failed to upload image');
    }
  }

  // Delete image from ImageKit
  static async deleteImage(fileId: string): Promise<boolean> {
    try {
      await imagekit.deleteFile(fileId);
      return true;
    } catch (error) {
      console.error('ImageKit delete error:', error);
      return false;
    }
  }

  // Get image URL with transformations
  static getImageUrl(path: string, width?: number, height?: number): string {
    let url = path;
    
    if (width || height) {
      const transformations = [];
      if (width) transformations.push(`w-${width}`);
      if (height) transformations.push(`h-${height}`);
      url = `${url}?tr=${transformations.join(',')}`;
    }
    
    return url;
  }

  // Get brand logo URL
  static getBrandLogo(): string {
    // You'll replace this with your actual brand logo URL after uploading
    return 'https://ik.imagekit.io/your_app_name/brand/logo.png';
  }

  // Upload brand logo
  static async uploadBrandLogo(file: Buffer | string, fileName: string): Promise<string> {
    return await this.uploadImage(file, fileName, 'brand');
  }
}

export default imagekit;