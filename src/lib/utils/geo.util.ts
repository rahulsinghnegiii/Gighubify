// Utilities for geo-location detection to determine payment gateway

/**
 * Gets the user's IP address
 * Uses a public API for demonstration purposes
 * In production, you might want to use a more reliable service
 */
export const getIPAddress = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error getting IP address:', error);
    throw error;
  }
};

/**
 * Checks if an IP address is from India
 * Uses a public API for demonstration purposes
 * In production, you might want to use a more reliable service
 */
export const isIndianIP = async (ipAddress: string): Promise<boolean> => {
  try {
    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
    const data = await response.json();
    return data.country_code === 'IN';
  } catch (error) {
    console.error('Error checking if IP is Indian:', error);
    throw error;
  }
};

/**
 * Gets the user's country code
 * Uses a public API for demonstration purposes
 * In production, you might want to use a more reliable service
 */
export const getCountryCode = async (ipAddress: string): Promise<string> => {
  try {
    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
    const data = await response.json();
    return data.country_code;
  } catch (error) {
    console.error('Error getting country code:', error);
    throw error;
  }
};

/**
 * Gets the user's currency code based on their country
 * This is a simplified implementation with just a few countries
 */
export const getCurrencyCodeByCountry = (countryCode: string): string => {
  const currencyMap: Record<string, string> = {
    'IN': 'INR',  // India - Indian Rupee
    'US': 'USD',  // United States - US Dollar
    'GB': 'GBP',  // United Kingdom - British Pound
    'EU': 'EUR',  // European Union - Euro
    'CA': 'CAD',  // Canada - Canadian Dollar
    'AU': 'AUD',  // Australia - Australian Dollar
    'JP': 'JPY',  // Japan - Japanese Yen
    'CN': 'CNY',  // China - Chinese Yuan
    'SG': 'SGD',  // Singapore - Singapore Dollar
    'AE': 'AED',  // UAE - UAE Dirham
  };
  
  return currencyMap[countryCode] || 'USD'; // Default to USD if country not in map
};

/**
 * Gets the user's country and appropriate currency based on their IP
 */
export const getUserLocationInfo = async (): Promise<{
  countryCode: string;
  currency: string;
  isIndian: boolean;
}> => {
  try {
    const ipAddress = await getIPAddress();
    const countryCode = await getCountryCode(ipAddress);
    const currency = getCurrencyCodeByCountry(countryCode);
    const isIndian = countryCode === 'IN';
    
    return {
      countryCode,
      currency,
      isIndian
    };
  } catch (error) {
    console.error('Error getting user location info:', error);
    // Default values if there's an error
    return {
      countryCode: 'US',
      currency: 'USD',
      isIndian: false
    };
  }
}; 