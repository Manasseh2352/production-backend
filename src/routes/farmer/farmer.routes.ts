import { Router } from "express";
import multer from "multer";

import { requireAuth } from "../../middleware/authMiddleware";
import { farmerController } from "../../controllers/farmerController";
import { orderController } from "../../controllers/orderController";
import { notificationController } from "../../controllers/notificationController";
import { walletController } from "../../controllers/walletController";
import { acceptRejectOrderParamsSchema } from "../../validators/orderValidator";


export const farmerRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

farmerRouter.post("/profile", requireAuth, farmerController.createProfile);
farmerRouter.patch("/profile", requireAuth, farmerController.updateProfile);
farmerRouter.get("/profile", requireAuth, farmerController.getProfile);

farmerRouter.post(
  "/profile-image",
  requireAuth,
  upload.single("image"),
  farmerController.uploadProfileImage
);

farmerRouter.post(
  "/product-image",
  requireAuth,
  upload.single("image"),
  farmerController.uploadProductImage
);

farmerRouter.get("/dashboard", requireAuth, farmerController.dashboard);

farmerRouter.get("/products", requireAuth, farmerController.listProducts);
farmerRouter.get("/orders", requireAuth, farmerController.listOrders);

farmerRouter.post(
  "/orders/:orderId/accept",
  requireAuth,
  (req, res, next) => {
    try {
      acceptRejectOrderParamsSchema.parse({
        orderId: Array.isArray(req.params.orderId)
          ? req.params.orderId[0]
          : req.params.orderId,
      });
      next();
    } catch (e) {
      next(e);
    }
  },
  orderController.acceptOrder
);


farmerRouter.post(
  "/orders/:orderId/reject",
  requireAuth,
  (req, res, next) => {

  try {
    acceptRejectOrderParamsSchema.parse({
      orderId: Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId,
    });
    next();
  } catch (e) {
    next(e);
  }
}, orderController.rejectOrder);

farmerRouter.post(
  "/orders/:orderId/advance-status",
  requireAuth,
  (req, res, next) => {
    try {
      acceptRejectOrderParamsSchema.parse({
        orderId: Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId,
      });
      next();
    } catch (e) {
      next(e);
    }
  },
  orderController.advanceShipmentStatus
);

// Notifications (shared controller, keyed on the authenticated user)
farmerRouter.get("/notifications", requireAuth, notificationController.list);
farmerRouter.get(
  "/notifications/unread-count",
  requireAuth,
  notificationController.unreadCount
);
farmerRouter.post("/notifications/read-all", requireAuth, notificationController.markAllRead);
farmerRouter.post("/notifications/:id/read", requireAuth, notificationController.markRead);

// Escrow wallet
farmerRouter.get("/wallet", requireAuth, walletController.getWallet);
farmerRouter.get("/wallet/transactions", requireAuth, walletController.listTransactions);
farmerRouter.post("/wallet/withdraw", requireAuth, walletController.requestWithdrawal);

