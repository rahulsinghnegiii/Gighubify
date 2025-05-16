/**
 * Platform fee utility functions
 * These functions help calculate platform fees for orders
 */

// Platform fee constants
export const PLATFORM_FEE_PERCENTAGE = 10; // 10% fee

/**
 * Calculate the platform fee amount based on the base price
 * @param baseAmount The base amount before fees
 * @returns The platform fee amount
 */
export const calculatePlatformFee = (baseAmount: number): number => {
  return (baseAmount * PLATFORM_FEE_PERCENTAGE) / 100;
};

/**
 * Calculate the total amount including platform fee
 * @param baseAmount The base amount before fees
 * @returns The total amount including platform fee
 */
export const calculateTotalWithFee = (baseAmount: number): number => {
  const fee = calculatePlatformFee(baseAmount);
  return baseAmount + fee;
};

/**
 * Calculate the seller payout amount after deducting platform fee
 * @param baseAmount The base amount before fees
 * @returns The amount the seller will receive
 */
export const calculateSellerAmount = (baseAmount: number): number => {
  // Seller receives the original amount minus platform fee
  return baseAmount - calculatePlatformFee(baseAmount);
};

/**
 * Get a breakdown of all amounts for an order
 * @param baseAmount The base order amount
 * @returns Object containing all calculated amounts
 */
export const getOrderAmountBreakdown = (baseAmount: number) => {
  const platformFee = calculatePlatformFee(baseAmount);
  const totalWithFee = baseAmount + platformFee;
  const sellerAmount = baseAmount - platformFee;
  
  return {
    baseAmount,
    platformFee,
    totalWithFee,
    sellerAmount
  };
}; 