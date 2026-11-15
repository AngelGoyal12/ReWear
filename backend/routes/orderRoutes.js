const express = require("express");

const {
    getMyOrders,
    getReceivedOrders,
    getOrderById,
    payOrder,
    updateOrderStatus
} = require("../controllers/orderController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/my-orders", getMyOrders);

router.get("/received", getReceivedOrders);

router.post("/:id/pay", payOrder);

router.put("/:id/status", updateOrderStatus);

router.get("/:id", getOrderById);

module.exports = router;