import { Link } from "react-router-dom";

function ProductCard({ product }) {

    let image = null;

    try {
        if (product.images) {

            const images = JSON.parse(product.images);

            if (images.length > 0) {
                image = images[0].startsWith("http")
                    ? images[0]
                    : `http://localhost:5000${images[0]}`;
            }
        }

    } catch (error) {

        console.error(
            "Error reading product images:",
            error
        );

    }


    // Support older products
    // that may still use image_url

    if (!image && product.image_url) {
        image = product.image_url;
    }


    return (

        <article className="product-card">

            {/* PRODUCT IMAGE */}

            <div className="product-image">

                {image ? (

                    <img
                        src={image}
                        alt={product.title}
                    />

                ) : (

                    <div className="no-product-image">
                        No Image
                    </div>

                )}

            </div>


            {/* PRODUCT INFORMATION */}

            <div className="product-info">

                <div className="product-category">
                    {product.category}
                </div>


                <h3>
                    {product.title}
                </h3>


                <p className="product-meta">
                    {product.size || "One size"}
                    {" · "}
                    {product.condition_status || "Good condition"}
                </p>


                <div className="product-bottom">

                    <strong>
                        ₹{product.price}
                    </strong>


                    <Link
                        to={`/product/${product.id}`}
                        className="view-product"
                    >
                        View item →
                    </Link>

                </div>

            </div>

        </article>

    );
}

export default ProductCard;