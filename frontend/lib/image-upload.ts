const MAX_IMAGE_UPLOAD_BYTES = 1_800_000;
const MAX_IMAGE_DIMENSION = 1800;
const JPEG_QUALITY_STEPS = [0.82, 0.72, 0.62];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read this image."));
    image.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not prepare this image for upload."));
          return;
        }

        resolve(blob);
      },
      type,
      quality,
    );
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function prepareImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size <= MAX_IMAGE_UPLOAD_BYTES) {
    return file;
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      return file;
    }

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    let bestBlob: Blob | null = null;

    for (const quality of JPEG_QUALITY_STEPS) {
      const blob = await canvasToBlob(canvas, "image/jpeg", quality);
      bestBlob = blob;

      if (blob.size <= MAX_IMAGE_UPLOAD_BYTES) {
        break;
      }
    }

    if (!bestBlob || bestBlob.size >= file.size) {
      return file;
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "property-photo";

    return new File([bestBlob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function prepareImagesForUpload(files: File[]): Promise<File[]> {
  return Promise.all(files.map((file) => prepareImageForUpload(file)));
}
