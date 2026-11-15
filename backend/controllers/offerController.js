
const pool = require("../config/db");

// Validate offer amount
const isValidAmount = (amount) => {
    const value = Number(amount);
    return Number.isFinite(value) && value > 0;
};


// Create a new offer
const createOffer = async (req, res) => {
    let connection;

    try {
        const productId = req.params.productId;
        const buyerId = req.user.id;
        const { offer_amount } = req.body;

        if (!isValidAmount(offer_amount)) {
            return res.status(400).json({
                message: "Valid offer amount is required"
            });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [products] = await connection.query(
            `SELECT * FROM products
             WHERE id = ?
             FOR UPDATE`,
            [productId]
        );

        if (products.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                message: "Product not found"
            });
        }

        const product = products[0];

        if (Number(product.seller_id) === Number(buyerId)) {
            await connection.rollback();
            return res.status(400).json({
                message: "You cannot make an offer on your own listing"
            });
        }

        if (product.status !== "AVAILABLE") {
            await connection.rollback();
            return res.status(400).json({
                message: "This product is no longer available"
            });
        }

        const [existingOffers] = await connection.query(
            `SELECT id FROM offers
             WHERE product_id = ?
             AND buyer_id = ?
             AND status = 'PENDING'`,
            [productId, buyerId]
        );

        if (existingOffers.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                message: "You already have a pending offer for this product"
            });
        }

        const [result] = await connection.query(
            `INSERT INTO offers
             (product_id, buyer_id, seller_id, offer_amount)
             VALUES (?, ?, ?, ?)`,
            [
                productId,
                buyerId,
                product.seller_id,
                Number(offer_amount)
            ]
        );

        await connection.commit();

        return res.status(201).json({
            message: "Offer submitted successfully",
            offerId: result.insertId
        });

    } catch (error) {
        if (connection) await connection.rollback();

        console.error("Error creating offer:", error);

        return res.status(500).json({
            message: "Failed to submit offer"
        });

    } finally {
        if (connection) connection.release();
    }
};


// Get offers received by the seller
const getSellerOffers = async (req, res) => {
    try {
        const sellerId = req.user.id;

        const [offers] = await pool.query(
            `SELECT
                o.id,
                o.product_id,
                o.buyer_id,
                o.offer_amount,
                o.status,
                o.created_at,
                p.title,
                p.price,
                p.image_url,
                p.images,
                u.name AS buyer_name,
                u.email AS buyer_email
             FROM offers o
             JOIN products p ON o.product_id = p.id
             JOIN users u ON o.buyer_id = u.id
             WHERE o.seller_id = ?
             ORDER BY o.created_at DESC`,
            [sellerId]
        );

        return res.json(offers);

    } catch (error) {
        console.error("Error fetching seller offers:", error);

        return res.status(500).json({
            message: "Failed to fetch offers"
        });
    }
};


// Accept an offer
const acceptOffer = async (req, res) => {
    let connection;

    try {
        const offerId = req.params.offerId;
        const sellerId = req.user.id;

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [initialOffers] = await connection.query(
            `SELECT product_id
             FROM offers
             WHERE id = ? AND seller_id = ?`,
            [offerId, sellerId]
        );

        if (initialOffers.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Offer not found"
            });
        }

        const productId = initialOffers[0].product_id;

        const [products] = await connection.query(
            `SELECT *
             FROM products
             WHERE id = ? AND seller_id = ?
             FOR UPDATE`,
            [productId, sellerId]
        );

        if (products.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Product not found"
            });
        }

        const [offers] = await connection.query(
            `SELECT *
             FROM offers
             WHERE id = ? AND seller_id = ?
             FOR UPDATE`,
            [offerId, sellerId]
        );

        if (
            offers.length === 0 ||
            offers[0].status !== "PENDING"
        ) {
            await connection.rollback();

            return res.status(400).json({
                message: "Offer not found or already processed"
            });
        }

        const product = products[0];
        const offer = offers[0];

        if (product.status !== "AVAILABLE") {
            await connection.rollback();

            return res.status(400).json({
                message: "This product is no longer available"
            });
        }

        // Accept the offer
        await connection.query(
            `UPDATE offers
             SET status = 'ACCEPTED'
             WHERE id = ?`,
            [offerId]
        );

        // Create an order using the accepted offer amount
        const [orderResult] = await connection.query(
            `INSERT INTO orders
             (offer_id, product_id, buyer_id, seller_id, amount)
             VALUES (?, ?, ?, ?, ?)`,
            [
                offer.id,
                product.id,
                offer.buyer_id,
                sellerId,
                offer.offer_amount
            ]
        );

        // Mark the product as sold
        await connection.query(
            `UPDATE products
             SET status = 'SOLD'
             WHERE id = ?`,
            [productId]
        );

        // Reject other pending offers
        await connection.query(
            `UPDATE offers
             SET status = 'REJECTED'
             WHERE product_id = ?
             AND id != ?
             AND status = 'PENDING'`,
            [productId, offerId]
        );

        // Reject pending purchase requests because this offer won
        await connection.query(
            `UPDATE purchase_requests
             SET status = 'REJECTED'
             WHERE product_id = ?
             AND status = 'PENDING'`,
            [productId]
        );

        await connection.commit();

        return res.json({
            message: "Offer accepted and order created successfully",
            orderId: orderResult.insertId
        });

    } catch (error) {
        if (connection) await connection.rollback();

        console.error("Error accepting offer:", error);

        return res.status(500).json({
            message: "Failed to accept offer"
        });

    } finally {
        if (connection) connection.release();
    }
};


// Reject an offer
const rejectOffer = async (req, res) => {
    try {
        const offerId = req.params.offerId;
        const sellerId = req.user.id;

        const [result] = await pool.query(
            `UPDATE offers
             SET status = 'REJECTED'
             WHERE id = ?
             AND seller_id = ?
             AND status = 'PENDING'`,
            [offerId, sellerId]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                message: "Offer not found or already processed"
            });
        }

        return res.json({
            message: "Offer rejected successfully"
        });

    } catch (error) {
        console.error("Error rejecting offer:", error);

        return res.status(500).json({
            message: "Failed to reject offer"
        });
    }
};


// Create a counteroffer
const createCounterOffer = async (req, res) => {
    let connection;

    try {
        const offerId = req.params.offerId;
        const sellerId = req.user.id;
        const { offer_amount } = req.body;

        if (!isValidAmount(offer_amount)) {
            return res.status(400).json({
                message: "Valid counter offer amount is required"
            });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [initialOffers] = await connection.query(
            `SELECT product_id FROM offers
             WHERE id = ? AND seller_id = ?`,
            [offerId, sellerId]
        );

        if (initialOffers.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                message: "Offer not found"
            });
        }

        const productId = initialOffers[0].product_id;

        // Lock the product
        const [products] = await connection.query(
            `SELECT * FROM products
             WHERE id = ? AND seller_id = ?
             FOR UPDATE`,
            [productId, sellerId]
        );

        if (products.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                message: "Product not found"
            });
        }

        const [offers] = await connection.query(
            `SELECT * FROM offers
             WHERE id = ? AND seller_id = ?
             FOR UPDATE`,
            [offerId, sellerId]
        );

        if (offers.length === 0 || offers[0].status !== "PENDING") {
            await connection.rollback();
            return res.status(400).json({
                message: "Offer not found or already processed"
            });
        }

        if (products[0].status !== "AVAILABLE") {
            await connection.rollback();
            return res.status(400).json({
                message: "This product is no longer available"
            });
        }

        const offer = offers[0];

        // Create the seller's counteroffer
        const [result] = await connection.query(
            `INSERT INTO offers
             (product_id, buyer_id, seller_id, offer_amount, status, parent_offer_id)
             VALUES (?, ?, ?, ?, 'PENDING', ?)`,
            [
                offer.product_id,
                offer.buyer_id,
                sellerId,
                Number(offer_amount),
                offer.id
            ]
        );

        // Mark the original offer as countered
        await connection.query(
            `UPDATE offers
             SET status = 'COUNTERED'
             WHERE id = ?`,
            [offerId]
        );

        await connection.commit();

        return res.status(201).json({
            message: "Counter offer submitted successfully",
            offerId: result.insertId
        });

    } catch (error) {
        if (connection) await connection.rollback();

        console.error("Error creating counter offer:", error);

        return res.status(500).json({
            message: "Failed to submit counter offer"
        });

    } finally {
        if (connection) connection.release();
    }
};


// Get offers sent by the buyer
const getMyOffers = async (req, res) => {
    try {
        const buyerId = req.user.id;

        const [offers] = await pool.query(
            `SELECT
                o.id,
                o.product_id,
                o.offer_amount,
                o.status,
                o.parent_offer_id,
                o.created_at,
                p.title,
                p.price,
                p.image_url,
                p.images,
                u.name AS seller_name,
                u.email AS seller_email
             FROM offers o
             JOIN products p ON o.product_id = p.id
             JOIN users u ON o.seller_id = u.id
             WHERE o.buyer_id = ?
             ORDER BY o.created_at DESC`,
            [buyerId]
        );

        return res.json(offers);

    } catch (error) {
        console.error("Error fetching my offers:", error);

        return res.status(500).json({
            message: "Failed to fetch your offers"
        });
    }
};


// Accept a counteroffer
const acceptCounterOffer = async (req, res) => {
    let connection;

    try {
        const offerId = req.params.offerId;
        const buyerId = req.user.id;

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [initialOffers] = await connection.query(
            `SELECT product_id
             FROM offers
             WHERE id = ? AND buyer_id = ?`,
            [offerId, buyerId]
        );

        if (initialOffers.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Offer not found"
            });
        }

        const productId = initialOffers[0].product_id;

        // Lock the product
        const [products] = await connection.query(
            `SELECT *
             FROM products
             WHERE id = ?
             FOR UPDATE`,
            [productId]
        );

        if (products.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Product not found"
            });
        }

        // Lock the counter-offer
        const [offers] = await connection.query(
            `SELECT *
             FROM offers
             WHERE id = ? AND buyer_id = ?
             FOR UPDATE`,
            [offerId, buyerId]
        );

        if (offers.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Offer not found"
            });
        }

        const offer = offers[0];
        const product = products[0];

        if (!offer.parent_offer_id) {
            await connection.rollback();

            return res.status(400).json({
                message: "This is not a counteroffer"
            });
        }

        if (offer.status !== "PENDING") {
            await connection.rollback();

            return res.status(400).json({
                message: "This counteroffer has already been processed"
            });
        }

        if (product.status !== "AVAILABLE") {
            await connection.rollback();

            return res.status(400).json({
                message: "This product is no longer available"
            });
        }

        // Verify the original offer was countered
        const [parentOffers] = await connection.query(
            `SELECT id
             FROM offers
             WHERE id = ?
             AND status = 'COUNTERED'`,
            [offer.parent_offer_id]
        );

        if (parentOffers.length === 0) {
            await connection.rollback();

            return res.status(400).json({
                message: "The original offer is no longer active"
            });
        }

        // Accept the counteroffer
        await connection.query(
            `UPDATE offers
             SET status = 'ACCEPTED'
             WHERE id = ?`,
            [offerId]
        );

        // Create an order using the counteroffer amount
        const [orderResult] = await connection.query(
            `INSERT INTO orders
             (offer_id, product_id, buyer_id, seller_id, amount)
             VALUES (?, ?, ?, ?, ?)`,
            [
                offer.id,
                product.id,
                buyerId,
                offer.seller_id,
                offer.offer_amount
            ]
        );

        // Mark product as sold
        await connection.query(
            `UPDATE products
             SET status = 'SOLD'
             WHERE id = ?`,
            [productId]
        );

        // Reject other pending offers
        await connection.query(
            `UPDATE offers
             SET status = 'REJECTED'
             WHERE product_id = ?
             AND id != ?
             AND status = 'PENDING'`,
            [productId, offerId]
        );

        // Reject pending purchase requests because the counteroffer won
        await connection.query(
            `UPDATE purchase_requests
             SET status = 'REJECTED'
             WHERE product_id = ?
             AND status = 'PENDING'`,
            [productId]
        );

        await connection.commit();

        return res.json({
            message: "Counteroffer accepted and order created successfully",
            orderId: orderResult.insertId
        });

    } catch (error) {
        if (connection) await connection.rollback();

        console.error("Error accepting counteroffer:", error);

        return res.status(500).json({
            message: "Failed to accept counteroffer"
        });

    } finally {
        if (connection) connection.release();
    }
};


// Reject a counteroffer
const rejectCounterOffer = async (req, res) => {
    try {
        const offerId = req.params.offerId;
        const buyerId = req.user.id;

        // Only the buyer who received it can reject it
        const [result] = await pool.query(
            `UPDATE offers
             SET status = 'REJECTED'
             WHERE id = ?
             AND buyer_id = ?
             AND parent_offer_id IS NOT NULL
             AND status = 'PENDING'`,
            [offerId, buyerId]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                message: "Counteroffer not found or already processed"
            });
        }

        return res.json({
            message: "Counteroffer rejected successfully"
        });

    } catch (error) {
        console.error("Error rejecting counteroffer:", error);

        return res.status(500).json({
            message: "Failed to reject counteroffer"
        });
    }
};


module.exports = {
    createOffer,
    getSellerOffers,
    acceptOffer,
    rejectOffer,
    createCounterOffer,
    getMyOffers,
    acceptCounterOffer,
    rejectCounterOffer
};
