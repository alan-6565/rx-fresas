/**
 * Shrinks a phone photo in the browser before it's sent, so it uploads fast
 * from the truck and stays under the server's size limit. PNG keeps a logo's
 * see-through background; everything else becomes a JPEG.
 */
export async function shrink(file: File, max = 1400, type: "image/jpeg" | "image/png" = "image/jpeg"): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't read that photo"))), type, 0.85));
  return new File([blob], type === "image/png" ? "photo.png" : "photo.jpg", { type });
}
