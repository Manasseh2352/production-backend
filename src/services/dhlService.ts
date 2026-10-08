export const dhlService = {
  generateTrackingNumber() {
    const stamp = Date.now().toString().slice(-8);
    const suffix = Math.random().toString().slice(2, 6).padStart(4, "0");
    return `DHL${stamp}${suffix}`;
  },

  getTrackingStages(status?: string | null) {
    const stages = [
      { key: "PENDING", label: "Order confirmed", detail: "We have received your order and prepared the shipment." },
      { key: "PACKED", label: "Packed", detail: "Your produce is packed and ready for dispatch." },
      { key: "SHIPPED", label: "In transit", detail: "DHL has picked up your parcel and is moving it to the destination." },
      { key: "DELIVERED", label: "Delivered", detail: "Your parcel has been delivered to the destination location." },
    ];

    const indexByStatus: Record<string, number> = {
      PENDING: 0,
      PACKED: 1,
      SHIPPED: 2,
      DELIVERED: 3,
      CANCELLED: 0,
    };

    const currentIndex = Math.max(0, Math.min(3, indexByStatus[status ?? "PENDING"] ?? 0));

    return stages.map((stage, idx) => ({
      ...stage,
      active: idx === currentIndex && status !== "CANCELLED",
      completed: status === "CANCELLED" ? false : idx < currentIndex,
      cancelled: status === "CANCELLED",
    }));
  },

  getTrackingStatusLabel(status?: string | null) {
    switch (status) {
      case "DELIVERED":
        return "Delivered";
      case "SHIPPED":
        return "In transit";
      case "PACKED":
        return "Packed";
      case "CANCELLED":
        return "Cancelled";
      default:
        return "Awaiting dispatch";
    }
  },
};
