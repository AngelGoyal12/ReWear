import { getProductImageUrls } from "../utils/productImages";

function ProductImage({ product, alt, width = 200 }) {
    const images = getProductImageUrls(product);
    const imageUrl = images[0];

    if (!imageUrl) {
        return <p>No Image</p>;
    }

    return (
        <img
            src={imageUrl}
            alt={alt || product?.title || "Product"}
            width={width}
            style={{
                maxWidth: "100%",
                height: "auto",
                objectFit: "cover"
            }}
        />
    );
}

export default ProductImage;