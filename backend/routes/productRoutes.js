const express = require("express");

const {
    getProducts,
    getProductById,
    createProduct,
    getMyListings,
    deleteProduct,
    updateProduct
} = require("../controllers/productController");

const {
    createPurchaseRequest,
    getSellerRequests,
    acceptPurchaseRequest,
    rejectPurchaseRequest,
    getMyRequests
} = require("../controllers/purchaseRequestController");

const {
    createOffer,
    getSellerOffers,
    acceptOffer,
    rejectOffer,
    createCounterOffer,
    getMyOffers,
    acceptCounterOffer,
    rejectCounterOffer
} = require("../controllers/offerController");

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", getProducts);

router.get("/my-listings", authMiddleware, getMyListings);

router.get(
    "/purchase-requests",
    authMiddleware,
    getSellerRequests
);

router.get(
    "/my-requests",
    authMiddleware,
    getMyRequests
);

router.post(
    "/:productId/request",
    authMiddleware,
    createPurchaseRequest
);

router.post(
    "/:productId/offer",
    authMiddleware,
    createOffer
);

router.put(
    "/purchase-requests/:requestId/accept",
    authMiddleware,
    acceptPurchaseRequest
);

router.put(
    "/purchase-requests/:requestId/reject",
    authMiddleware,
    rejectPurchaseRequest
);

router.get(
    "/offers",
    authMiddleware,
    getSellerOffers
);

router.get(
    "/my-offers",
    authMiddleware,
    getMyOffers
);

router.put(
    "/offers/:offerId/accept",
    authMiddleware,
    acceptOffer
);

router.put(
    "/offers/:offerId/reject",
    authMiddleware,
    rejectOffer
);

router.post(
    "/offers/:offerId/counter",
    authMiddleware,
    createCounterOffer
);

router.put(
    "/offers/:offerId/accept-counter",
    authMiddleware,
    acceptCounterOffer
);

router.put(
    "/offers/:offerId/reject-counter",
    authMiddleware,
    rejectCounterOffer
);

router.get("/:id", getProductById);

router.post(
    "/",
    authMiddleware,
    upload.array("images", 5),
    createProduct
);

router.put(
    "/:id",
    authMiddleware,
    upload.array("images", 5),
    updateProduct
);

router.delete("/:id", authMiddleware, deleteProduct);

module.exports = router;