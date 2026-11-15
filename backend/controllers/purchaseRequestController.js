
const pool = require("../config/db");

// Create a purchase request
const createPurchaseRequest = async (req, res) => {
    let connection;

    try {
        const productId = req.params.productId;
        const buyerId = req.user.id;

        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Lock the product so simultaneous requests are handled safely
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
                message: "You cannot request your own listing"
            });
        }

        if (product.status !== "AVAILABLE") {
            await connection.rollback();
            return res.status(400).json({
                message: "This product is no longer available"
            });
        }

        // Check for an existing pending request
        const [existingRequests] = await connection.query(
            `SELECT id FROM purchase_requests
             WHERE product_id = ?
             AND buyer_id = ?
             AND status = 'PENDING'`,
            [productId, buyerId]
        );

        if (existingRequests.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                message: "You already requested this product"
            });
        }

        const [result] = await connection.query(
            `INSERT INTO purchase_requests
             (product_id, buyer_id, seller_id)
             VALUES (?, ?, ?)`,
            [productId, buyerId, product.seller_id]
        );

        await connection.commit();

        return res.status(201).json({
            message: "Purchase request sent successfully",
            requestId: result.insertId
        });

    } catch (error) {
        if (connection) await connection.rollback();

        console.error("Error creating purchase request:", error);

        return res.status(500).json({
            message: "Failed to send purchase request"
        });

    } finally {
        if (connection) connection.release();
    }
};


// Get purchase requests received by the seller
const getSellerRequests = async (req, res) => {
    try {
        const sellerId = req.user.id;

        const [requests] = await pool.query(
            `SELECT
                pr.id,
                pr.product_id,
                pr.buyer_id,
                pr.status,
                pr.created_at,
                p.title,
                p.price,
                p.image_url,
                p.images,
                u.name AS buyer_name,
                u.email AS buyer_email
             FROM purchase_requests pr
             JOIN products p ON pr.product_id = p.id
             JOIN users u ON pr.buyer_id = u.id
             WHERE pr.seller_id = ?
             ORDER BY pr.created_at DESC`,
            [sellerId]
        );

        return res.json(requests);

    } catch (error) {
        console.error("Error fetching seller requests:", error);

        return res.status(500).json({
            message: "Failed to fetch purchase requests"
        });
    }
};


// Accept a purchase request

const acceptPurchaseRequest = async (req, res) => {
    let connection;

    try {
        const requestId = req.params.requestId;
        const sellerId = req.user.id;

        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Find the request
        const [initialRequests] = await connection.query(
            `SELECT product_id FROM purchase_requests
             WHERE id = ? AND seller_id = ?`,
            [requestId, sellerId]
        );

        if (initialRequests.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                message: "Purchase request not found"
            });
        }

        const productId = initialRequests[0].product_id;

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

        const product = products[0];

        // Lock and recheck the request
        const [requests] = await connection.query(
            `SELECT * FROM purchase_requests
             WHERE id = ? AND seller_id = ?
             FOR UPDATE`,
            [requestId, sellerId]
        );

        if (requests.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                message: "Purchase request not found"
            });
        }

        const request = requests[0];

        if (request.status !== "PENDING") {
            await connection.rollback();
            return res.status(400).json({
                message: "This request has already been processed"
            });
        }

        if (product.status !== "AVAILABLE") {
            await connection.rollback();
            return res.status(400).json({
                message: "This product is no longer available"
            });
        }

        // Create an order for the accepted request
        const [orderResult] = await connection.query(
            `INSERT INTO orders
             (purchase_request_id, product_id, buyer_id, seller_id, amount)
             VALUES (?, ?, ?, ?, ?)`,
            [
                request.id,
                product.id,
                request.buyer_id,
                sellerId,
                product.price
            ]
        );

        const orderId = orderResult.insertId;

        // Accept the purchase request
        await connection.query(
            `UPDATE purchase_requests
             SET status = 'ACCEPTED'
             WHERE id = ?`,
            [requestId]
        );

        // Mark product as sold
        await connection.query(
            `UPDATE products
             SET status = 'SOLD'
             WHERE id = ? AND seller_id = ?`,
            [productId, sellerId]
        );

        // Reject other pending purchase requests
        await connection.query(
            `UPDATE purchase_requests
             SET status = 'REJECTED'
             WHERE product_id = ?
             AND id != ?
             AND status = 'PENDING'`,
            [productId, requestId]
        );

        // Reject pending offers
        await connection.query(
            `UPDATE offers
             SET status = 'REJECTED'
             WHERE product_id = ?
             AND status = 'PENDING'`,
            [productId]
        );

        // Commit everything together
        await connection.commit();

        return res.json({
            message: "Purchase request accepted and order created successfully",
            orderId: orderId
        });

    } catch (error) {
        if (connection) await connection.rollback();

        console.error("Error accepting purchase request:", error);

        return res.status(500).json({
            message: "Failed to accept purchase request"
        });

    } finally {
        if (connection) connection.release();
    }
};


// Reject a purchase request
const rejectPurchaseRequest = async (req, res) => {
    try {
        const requestId = req.params.requestId;
        const sellerId = req.user.id;

        const [result] = await pool.query(
            `UPDATE purchase_requests
             SET status = 'REJECTED'
             WHERE id = ?
             AND seller_id = ?
             AND status = 'PENDING'`,
            [requestId, sellerId]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                message: "Request not found or already processed"
            });
        }

        return res.json({
            message: "Purchase request rejected successfully"
        });

    } catch (error) {
        console.error("Error rejecting purchase request:", error);

        return res.status(500).json({
            message: "Failed to reject purchase request"
        });
    }
};


// Get purchase requests sent by the buyer
const getMyRequests = async (req, res) => {
    try {
        const buyerId = req.user.id;

        const [requests] = await pool.query(
            `SELECT
                pr.id,
                pr.product_id,
                pr.status,
                pr.created_at,
                p.title,
                p.price,
                p.image_url,
                p.images,
                p.category,
                p.size,
                p.condition_status,
                u.name AS seller_name,
                u.email AS seller_email
             FROM purchase_requests pr
             JOIN products p ON pr.product_id = p.id
             JOIN users u ON pr.seller_id = u.id
             WHERE pr.buyer_id = ?
             ORDER BY pr.created_at DESC`,
            [buyerId]
        );

        return res.json(requests);

    } catch (error) {
        console.error("Error fetching my requests:", error);

        return res.status(500).json({
            message: "Failed to fetch your requests"
        });
    }
};


module.exports = {
    createPurchaseRequest,
    getSellerRequests,
    acceptPurchaseRequest,
    rejectPurchaseRequest,
    getMyRequests
};
