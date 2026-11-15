const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export function getProductImageUrls(product) {
    if (!product) return [];

    let images = [];

    // Handle images stored as an array or JSON string.
    if (Array.isArray(product.images)) {
        images = product.images;
    } else if (typeof product.images === "string" && product.images.trim()) {
        try {
            const parsed = JSON.parse(product.images);

            if (Array.isArray(parsed)) {
                images = parsed;
            } else if (typeof parsed === "string") {
                images = [parsed];
            }
        } catch {
            // The value may be a single image URL/path, not JSON.
            images = [product.images];
        }
    }

    // Support the older image_url field.
    if (images.length === 0 && product.image_url) {
        images = [product.image_url];
    }

    // Convert each image into a usable URL.
    return images
        .filter((image) => typeof image === "string" && image.trim())
        .map((image) => {
            const trimmedImage = image.trim();

            // Cloudinary or another complete URL.
            if (/^https?:\/\//i.test(trimmedImage)) {
                return trimmedImage;
            }

            // Protocol-relative URL.
            if (trimmedImage.startsWith("//")) {
                return `https:${trimmedImage}`;
            }

            // Old local image path.
            const imagePath = trimmedImage.startsWith("/")
                ? trimmedImage
                : `/${trimmedImage}`;

            return `${API_BASE_URL}${imagePath}`;
        });
}