const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_IMAGE_EDGE = 480;
const IMAGE_EXTENSION =
  /\.(?:png|jpe?g|webp|gif|avif|bmp|svg|ico|apng|heic|heif)$/i;

/** Decode and resize an uploaded image into a portable, locally storable image. */
export async function prepareImage(file) {
  if (!(file instanceof Blob)) {
    throw new Error("请选择要上传的图片。");
  }
  if (!file.size) {
    throw new Error("图片文件为空，请选择其他图片。");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("单张图片不能超过 15 MB，请压缩后再上传。");
  }

  const originalName = typeof file.name === "string" ? file.name : "未命名图片";
  if (!file.type.startsWith("image/") && !IMAGE_EXTENSION.test(originalName)) {
    throw new Error("请选择 PNG、JPG、WebP 等图片文件。");
  }

  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.decoding = "async";
      element.onload = () => resolve(element);
      element.onerror = () =>
        reject(
          new Error("无法读取这张图片，请尝试转换为 PNG、JPG 或 WebP 格式。"),
        );
      element.src = sourceUrl;
    });

    if (!image.naturalWidth || !image.naturalHeight) {
      throw new Error("图片尺寸无效，请选择其他图片。");
    }

    const scale = Math.min(
      1,
      MAX_IMAGE_EDGE / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("当前浏览器无法处理图片，请尝试更新浏览器。");
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    // JPEG has no transparency; WebP preserves alpha for every other format.
    // Browsers without a WebP encoder automatically return a PNG data URL.
    const isJpeg =
      /image\/jpe?g/i.test(file.type) || /\.jpe?g$/i.test(originalName);
    const src = canvas.toDataURL(isJpeg ? "image/jpeg" : "image/webp", 0.9);
    if (!/^data:image\/(?:png|jpeg|webp);base64,/.test(src)) {
      throw new Error("图片处理失败，请选择其他图片。");
    }

    const name = originalName.replace(/\.[^.]+$/, "").trim() || "未命名图片";
    return { name, src };
  } catch (error) {
    if (error instanceof Error && /[\u3400-\u9fff]/.test(error.message))
      throw error;
    throw new Error("图片处理失败，请尝试转换为 PNG、JPG 或 WebP 格式。");
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}
