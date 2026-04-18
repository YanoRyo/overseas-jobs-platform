const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export type ImageValidationErrorCode =
  | "invalid_type"
  | "invalid_extension"
  | "too_large";

export type ImageValidationResult =
  | { valid: true }
  | { valid: false; code: ImageValidationErrorCode; error: string };

export function validateImageFile(file: File): ImageValidationResult {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return {
      valid: false,
      code: "invalid_type",
      error: `File type ${file.type || "unknown"} is not allowed. Use JPEG, PNG, or WebP.`,
    };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      code: "invalid_extension",
      error: `File extension .${ext} is not allowed.`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      code: "too_large",
      error: "File size exceeds 5MB limit.",
    };
  }

  return { valid: true };
}

/** バリデーション済みファイルから安全な拡張子を取得 */
export function getSafeExtension(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return ALLOWED_EXTENSIONS.has(ext) ? ext : "png";
}
