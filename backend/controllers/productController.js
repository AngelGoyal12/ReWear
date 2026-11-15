
const pool = require("../config/db");
const {
    cloudinary,
    uploadToCloudinary
} = require("../config/cloudinary");

// Safely read image URLs stored in the database
const parseImages = (images) => {
    if (!images) return [];

    if (Array.isArray(images)) {
        return images;
    }

    try {
        return JSON.parse(images);
    } catch (error) {
        console.error("Error parsing product images:", error);
        return [];
    }
};


// Extract the Cloudinary public ID from an image URL
const getCloudinaryPublicId = (imageUrl) => {
    try {
        const url = new URL(imageUrl);

        if (url.hostname !== "res.cloudinary.com") {
            return null;
        }

        const parts = url.pathname.split("/").filter(Boolean);
        const uploadIndex = parts.indexOf("upload");

        if (uploadIndex === -1) {
            return null;
        }

        const remainingParts = parts.slice(uploadIndex + 1);

        // Find the Cloudinary version segment
        const versionIndex = remainingParts.findIndex(
            (part) => /^v\d+$/.test(part)
        );

        // Only process standard versioned Cloudinary URLs
        if (versionIndex === -1) {
            return null;
        }

        const publicIdParts = remainingParts.slice(versionIndex + 1);

        if (publicIdParts.length === 0) {
            return null;
        }

        const lastIndex = publicIdParts.length - 1;

        // Remove the file extension
        publicIdParts[lastIndex] = publicIdParts[lastIndex].replace(
            /\.[^.]+$/,
            ""
        );

        return publicIdParts.join("/");

    } catch (error) {
        console.error("Error extracting Cloudinary public ID:", error);
        return null;
    }
};


// Delete images from Cloudinary
const deleteCloudinaryImages = async (images) => {
    const uniqueImages = [...new Set(images)];

    for (const imageUrl of uniqueImages) {
        const publicId = getCloudinaryPublicId(imageUrl);

        // Skip old local images and non-Cloudinary URLs
        if (!publicId) {
            continue;
        }

        try {
            const result = await cloudinary.uploader.destroy(
                publicId,
                {
                    resource_type: "image",
                    invalidate: true
                }
            );

            console.log(
                `Cloudinary cleanup: ${publicId} - ${result.result}`
            );

        } catch (error) {
            console.error(
                `Failed to delete Cloudinary image ${publicId}:`,
                error
            );
        }
    }
};


// Collect all stored image URLs
const getProductImages = (product) => {
    const images = parseImages(product.images);

    if (images.length === 0 && product.image_url) {
        images.push(product.image_url);
    }

    return images;
};


// Upload selected files to Cloudinary
const uploadProductImages = async (files) => {
    if (!files || files.length === 0) {
        return [];
    }

    const imageUrls = await Promise.all(
        files.map((file) =>
            uploadToCloudinary(file.buffer)
        )
    );

    return imageUrls;
};


const getProducts = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT *
             FROM products
             WHERE status = 'AVAILABLE'
             ORDER BY created_at DESC`
        );

        res.json(rows);

    } catch (error) {
        console.error("Error fetching products:", error);

        res.status(500).json({
            message: "Failed to fetch products"
        });
    }
};


const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query(
            "SELECT * FROM products WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json(rows[0]);

    } catch (error) {
        console.error("Error fetching product:", error);

        res.status(500).json({
            message: "Failed to fetch product"
        });
    }
};


const createProduct = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            size,
            condition_status,
            brand,
            price,
            location
        } = req.body;

        if (!title || !category || !price) {
            return res.status(400).json({
                message: "Title, category and price are required"
            });
        }

        const numericPrice = Number(price);

        if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
            return res.status(400).json({
                message: "Please enter a valid product price"
            });
        }

        const sellerId = req.user.id;

        // Upload images to Cloudinary
        const imageUrls = await uploadProductImages(req.files);

        const [result] = await pool.query(
            `INSERT INTO products
            (
                seller_id,
                title,
                description,
                category,
                size,
                condition_status,
                brand,
                price,
                images,
                location
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                sellerId,
                title,
                description,
                category,
                size,
                condition_status,
                brand,
                numericPrice,
                JSON.stringify(imageUrls),
                location
            ]
        );

        res.status(201).json({
            message: "Product listed successfully",
            productId: result.insertId,
            images: imageUrls
        });

    } catch (error) {
        console.error("Error creating product:", error);

        res.status(500).json({
            message: "Failed to create product"
        });
    }
};


const getMyListings = async (req, res) => {
    try {
        const sellerId = req.user.id;

        const [rows] = await pool.query(
            `SELECT *
             FROM products
             WHERE seller_id = ?
             ORDER BY created_at DESC`,
            [sellerId]
        );

        res.json(rows);

    } catch (error) {
        console.error("Error fetching my listings:", error);

        res.status(500).json({
            message: "Failed to fetch your listings"
        });
    }
};



const deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const sellerId = req.user.id;

        const [products] = await pool.query(
            `SELECT images, image_url, status
             FROM products
             WHERE id = ? AND seller_id = ?`,
            [productId, sellerId]
        );

        if (products.length === 0) {
            return res.status(404).json({
                message: "Product not found or you are not the seller"
            });
        }

        if (products[0].status !== "AVAILABLE") {
            return res.status(400).json({
                message: "Sold products cannot be deleted"
            });
        }

        const imagesToDelete = getProductImages(products[0]);

        const [result] = await pool.query(
            `DELETE FROM products
             WHERE id = ?
             AND seller_id = ?
             AND status = 'AVAILABLE'`,
            [productId, sellerId]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                message: "This product is no longer available for deletion"
            });
        }

        await deleteCloudinaryImages(imagesToDelete);

        return res.json({
            message: "Product deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting product:", error);

        return res.status(500).json({
            message: "Failed to delete product"
        });
    }
};


const updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const sellerId = req.user.id;

        const {
            title,
            description,
            category,
            size,
            condition_status,
            brand,
            price,
            location
        } = req.body;

        const numericPrice = Number(price);

        if (
            !title ||
            !category ||
            !Number.isFinite(numericPrice) ||
            numericPrice <= 0
        ) {
            return res.status(400).json({
                message: "Please provide a valid title, category and price"
            });
        }

        const [products] = await pool.query(
            `SELECT images, image_url, status
             FROM products
             WHERE id = ? AND seller_id = ?`,
            [productId, sellerId]
        );

        if (products.length === 0) {
            return res.status(404).json({
                message: "Product not found or you are not the seller"
            });
        }

        if (products[0].status !== "AVAILABLE") {
            return res.status(400).json({
                message: "Sold products cannot be edited"
            });
        }

        const oldImages = getProductImages(products[0]);

        const replacingImages = req.files && req.files.length > 0;

        let images = oldImages;

        if (replacingImages) {
            images = await uploadProductImages(req.files);
        }

        const [result] = await pool.query(
            `UPDATE products
             SET title = ?,
                 description = ?,
                 category = ?,
                 size = ?,
                 condition_status = ?,
                 brand = ?,
                 price = ?,
                 images = ?,
                 location = ?
             WHERE id = ?
             AND seller_id = ?
             AND status = 'AVAILABLE'`,
            [
                title,
                description,
                category,
                size,
                condition_status,
                brand,
                numericPrice,
                JSON.stringify(images),
                location,
                productId,
                sellerId
            ]
        );

        if (result.affectedRows === 0) {
            if (replacingImages) {
                await deleteCloudinaryImages(images);
            }

            return res.status(400).json({
                message: "This product is no longer available for editing"
            });
        }

        if (replacingImages) {
            await deleteCloudinaryImages(oldImages);
        }

        return res.json({
            message: "Product updated successfully",
            images
        });

    } catch (error) {
        console.error("Error updating product:", error);

        return res.status(500).json({
            message: "Failed to update product"
        });
    }
};


module.exports = {
    getProducts,
    getProductById,
    createProduct,
    getMyListings,
    deleteProduct,
    updateProduct
};
