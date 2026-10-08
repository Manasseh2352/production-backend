import { Router } from "express";
import multer from "multer";

import { requireAuth } from "../../middleware/authMiddleware";

import { buyerController } from "../../controllers/buyerController";
import {
  addSavedProductValidator,
  addWishlistItemValidator,
  updateBuyerProfileValidator,
} from "../../validators/buyerValidator";

import { orderController } from "../../controllers/orderController";
import { placeOrderSchema } from "../../validators/orderValidator";

import { notificationController } from "../../controllers/notificationController";



export const buyerRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Profile
buyerRouter.post("/profile", requireAuth, buyerController.createProfile);
buyerRouter.patch(
  "/profile",
  requireAuth,
  updateBuyerProfileValidator,
  buyerController.updateProfile
);
buyerRouter.get("/profile", requireAuth, buyerController.getProfile);

buyerRouter.post(
  "/profile-image",
  requireAuth,
  upload.single("image"),
  buyerController.uploadProfileImage
);

// Dashboard
buyerRouter.get("/dashboard", requireAuth, buyerController.dashboard);

// Saved Products
buyerRouter.get("/saved-products", requireAuth, buyerController.listSavedProducts);
buyerRouter.post(
  "/saved-products",
  requireAuth,
  addSavedProductValidator,
  buyerController.addSavedProduct
);
buyerRouter.delete(
  "/saved-products/:productId",
  requireAuth,
  buyerController.removeSavedProduct
);

// Wishlist
buyerRouter.get("/wishlist", requireAuth, buyerController.listWishlist);
buyerRouter.post(
  "/wishlist",
  requireAuth,
  addWishlistItemValidator,
  buyerController.addWishlistItem
);
buyerRouter.delete(
  "/wishlist/:productId",
  requireAuth,
  buyerController.removeWishlistItem
);

// Product catalog (buyer browses ACTIVE products)
buyerRouter.get("/products", requireAuth, buyerController.listProducts);
buyerRouter.get("/products/:productId", requireAuth, buyerController.getProduct);

// Orders
buyerRouter.post("/orders", requireAuth, (req, res, next) => {
  try {
    (req as any).validatedBody = placeOrderSchema.parse(req.body);
    next();
  } catch (e) {
    next(e);
  }
}, orderController.placeOrder);

buyerRouter.get("/orders", requireAuth, buyerController.listOrders);
buyerRouter.get("/orders/:orderId", requireAuth, buyerController.getOrder);
buyerRouter.delete("/orders/:orderId", requireAuth, buyerController.deleteOrder);

// Payment (simulated gateway)
buyerRouter.post("/orders/:orderId/pay", requireAuth, buyerController.payOrder);

// Buyer confirms goods received → releases farmer escrow
buyerRouter.post(
  "/orders/:orderId/confirm-received",
  requireAuth,
  orderController.confirmReceived
);

// Notifications
buyerRouter.get("/notifications", requireAuth, notificationController.list);
buyerRouter.get(
  "/notifications/unread-count",
  requireAuth,
  notificationController.unreadCount
);
buyerRouter.post("/notifications/read-all", requireAuth, notificationController.markAllRead);
buyerRouter.post("/notifications/:id/read", requireAuth, notificationController.markRead);

// Lightweight "added to cart" notification (no server-side cart)
buyerRouter.post("/notifications/cart", requireAuth, notificationController.notifyCartItem);
