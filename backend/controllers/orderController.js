const pool = require("../config/db");

const crypto = require("crypto");

// Get orders placed by the logged-in buyer
const getMyOrders = async (req, res) => {
    try {
        const [orders] = await pool.query(
            `SELECT
                o.*,
                p.title AS product_title,
                p.image_url,
                p.images,
                p.category,
                p.size,
                buyer.name AS buyer_name,
                seller.name AS seller_name
             FROM orders o
             JOIN products p ON o.product_id = p.id
             JOIN users buyer ON o.buyer_id = buyer.id
             JOIN users seller ON o.seller_id = seller.id
             WHERE o.buyer_id = ?
             ORDER BY o.created_at DESC`,
            [req.user.id]
        );

        return res.json(orders);
    } catch (error) {
        console.error("Fetch buyer orders error:", error);

        return res.status(500).json({
            message: "Unable to fetch your orders"
        });
    }
};


// Get orders received by the logged-in seller
const getReceivedOrders = async (req, res) => {
    try {
        const [orders] = await pool.query(
            `SELECT
                o.*,
                p.title AS product_title,
                p.image_url,
                p.images,
                p.category,
                p.size,
                buyer.name AS buyer_name,
                seller.name AS seller_name
             FROM orders o
             JOIN products p ON o.product_id = p.id
             JOIN users buyer ON o.buyer_id = buyer.id
             JOIN users seller ON o.seller_id = seller.id
             WHERE o.seller_id = ?
             ORDER BY o.created_at DESC`,
            [req.user.id]
        );

        return res.json(orders);
    } catch (error) {
        console.error("Fetch received orders error:", error);

        return res.status(500).json({
            message: "Unable to fetch received orders"
        });
    }
};


// Get details of one order
const getOrderById = async (req, res) => {
    try {
        const orderId = Number(req.params.id);

        if (!Number.isInteger(orderId) || orderId <= 0) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        const [orders] = await pool.query(
            `SELECT
                o.*,
                p.title AS product_title,
                p.description,
                p.image_url,
                p.images,
                p.category,
                p.size,
                p.condition_status,
                p.brand,
                p.location,
                buyer.name AS buyer_name,
                buyer.email AS buyer_email,
                seller.name AS seller_name,
                seller.email AS seller_email
             FROM orders o
             JOIN products p ON o.product_id = p.id
             JOIN users buyer ON o.buyer_id = buyer.id
             JOIN users seller ON o.seller_id = seller.id
             WHERE o.id = ?`,
            [orderId]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        const order = orders[0];

        if (
            order.buyer_id !== req.user.id &&
            order.seller_id !== req.user.id
        ) {
            return res.status(403).json({
                message: "You are not authorized to view this order"
            });
        }

        return res.json(order);
    } catch (error) {
        console.error("Fetch order details error:", error);

        return res.status(500).json({
            message: "Unable to fetch order details"
        });
    }
};


// Simulated payment (not a real payment gateway)
// Simulated payment processing
const payOrder = async (req, res) => {
    let connection;

    try {
        const orderId = Number(req.params.id);

        const paymentMethod = String(
            req.body?.paymentMethod || ""
        ).toUpperCase();

        const simulateFailure = req.body?.simulateFailure === true;

        const allowedMethods = ["UPI", "CARD", "NET_BANKING"];

        if (!Number.isInteger(orderId) || orderId <= 0) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        if (!allowedMethods.includes(paymentMethod)) {
            return res.status(400).json({
                message: "Select a valid payment method"
            });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [orders] = await connection.query(
            `SELECT *
             FROM orders
             WHERE id = ?
             FOR UPDATE`,
            [orderId]
        );

        if (orders.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Order not found"
            });
        }

        const order = orders[0];

        if (order.buyer_id !== req.user.id) {
            await connection.rollback();

            return res.status(403).json({
                message: "Only the buyer can make payment"
            });
        }

        if (order.payment_status === "PAID") {
            await connection.commit();

            return res.json({
                message: "This order has already been paid",
                orderId: order.id,
                paymentStatus: "PAID",
                orderStatus: order.status
            });
        }

        if (
            order.status !== "PENDING_PAYMENT" ||
            order.payment_status !== "PENDING"
        ) {
            await connection.rollback();

            return res.status(400).json({
                message: "This order is not eligible for payment"
            });
        }

        const paymentStatus = simulateFailure ? "FAILED" : "PAID";

        const transactionReference =
            `DEMO-${crypto.randomUUID()}`;

        // Save the payment attempt
        await connection.query(
            `INSERT INTO payment_transactions
             (order_id, buyer_id, amount, payment_method,
              payment_status, transaction_reference)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                order.id,
                order.buyer_id,
                order.amount,
                paymentMethod,
                paymentStatus,
                transactionReference
            ]
        );

        // Update the order only if payment succeeds
        if (paymentStatus === "PAID") {
            await connection.query(
                `UPDATE orders
                 SET payment_status = 'PAID',
                     status = 'CONFIRMED'
                 WHERE id = ?`,
                [orderId]
            );
        }

        await connection.commit();

        return res.json({
            message: simulateFailure
                ? "Simulated payment failed. You can try again."
                : "Simulated payment successful!",
            orderId,
            paymentStatus,
            orderStatus: paymentStatus === "PAID"
                ? "CONFIRMED"
                : "PENDING_PAYMENT",
            paymentMethod,
            transactionReference
        });

    } catch (error) {
        if (connection) await connection.rollback();

        console.error("Payment processing error:", error);

        return res.status(500).json({
            message: "Unable to process payment"
        });

    } finally {
        if (connection) connection.release();
    }
};

// Update order progress
const updateOrderStatus = async (req, res) => {
    let connection;

    try {
        const orderId = Number(req.params.id);
        const newStatus = String(req.body?.status || "").toUpperCase();

        if (!newStatus) {
            return res.status(400).json({
                message: "Order status is required"
            });
        }

        if (!Number.isInteger(orderId) || orderId <= 0) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        const sellerTransitions = {
            CONFIRMED: "PROCESSING",
            PROCESSING: "SHIPPED",
            SHIPPED: "DELIVERED"
        };

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [orders] = await connection.query(
            `SELECT *
             FROM orders
             WHERE id = ?
             FOR UPDATE`,
            [orderId]
        );

        if (orders.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Order not found"
            });
        }

        const order = orders[0];

        if (order.payment_status !== "PAID") {
            await connection.rollback();

            return res.status(400).json({
                message: "The order must be paid before its status can be updated"
            });
        }

        // Seller updates processing, shipping and delivery
        if (order.seller_id === req.user.id) {
            const expectedStatus = sellerTransitions[order.status];

            if (!expectedStatus || newStatus !== expectedStatus) {
                await connection.rollback();

                return res.status(400).json({
                    message: `Invalid status change. The next status must be ${expectedStatus || "none"}`
                });
            }
        }

        // Buyer confirms that the item has been delivered
        else if (order.buyer_id === req.user.id) {
            if (
                order.status !== "DELIVERED" ||
                newStatus !== "COMPLETED"
            ) {
                await connection.rollback();

                return res.status(400).json({
                    message: "You can mark the order completed only after it is delivered"
                });
            }
        } else {
            await connection.rollback();

            return res.status(403).json({
                message: "You are not authorized to update this order"
            });
        }

        await connection.query(
            `UPDATE orders
             SET status = ?
             WHERE id = ?`,
            [newStatus, orderId]
        );

        await connection.commit();

        return res.json({
            message: "Order status updated successfully",
            orderId,
            status: newStatus
        });

    } catch (error) {
        if (connection) await connection.rollback();

        console.error("Update order status error:", error);

        return res.status(500).json({
            message: "Unable to update order status"
        });
    } finally {
        if (connection) connection.release();
    }
};


module.exports = {
    getMyOrders,
    getReceivedOrders,
    getOrderById,
    payOrder,
    updateOrderStatus
};