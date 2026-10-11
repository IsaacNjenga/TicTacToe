export interface InventorySummary {
  totalProducts: number;
  totalItemsInStock: number;
  totalStockValue: number;
  lowStockItemsCount: number;
  outOfStockItemsCount: number;
}

const LOW_STOCK_THRESHOLD = 5;

/**
 * Computes inventory summary metrics based on populated or unpopulated inventory items.
 */
export function calculateInventorySummary(
  inventoryItems: Array<{ product: any; quantity: number }> = [],
): InventorySummary {
  let totalProducts = 0;
  let totalItemsInStock = 0;
  let totalStockValue = 0;
  let lowStockItemsCount = 0;
  let outOfStockItemsCount = 0;

  if (!Array.isArray(inventoryItems) || inventoryItems.length === 0) {
    return {
      totalProducts: 0,
      totalItemsInStock: 0,
      totalStockValue: 0,
      lowStockItemsCount: 0,
      outOfStockItemsCount: 0,
    };
  }

  for (const item of inventoryItems) {
    if (!item) continue;

    const qty = Number(item.quantity) || 0;

    // Safely extract price if product is populated as an object
    const unitPrice =
      typeof item.product === "object" && item.product !== null
        ? Number(
            "costPrice" in item.product
              ? item.product.costPrice
              : "price" in item.product
                ? item.product.price
                : 0,
          ) || 0
        : 0;

    totalProducts += 1;
    totalItemsInStock += qty;
    totalStockValue += qty * unitPrice;

    if (qty === 0) {
      outOfStockItemsCount += 1;
    } else if (qty <= LOW_STOCK_THRESHOLD) {
      lowStockItemsCount += 1;
    }
  }

  return {
    totalProducts,
    totalItemsInStock,
    totalStockValue,
    lowStockItemsCount,
    outOfStockItemsCount,
  };
}
