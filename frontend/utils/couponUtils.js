import sampleData from '../assets/sample_api_output.json';

export const getTotalCouponsCount = () => {
  try {
    let totalCount = 0;
    if (sampleData?.all_coupons) {
      sampleData.all_coupons.forEach((couponGroup) => {
        if (couponGroup.offers) {
          totalCount += couponGroup.offers.length;
        }
      });
    }
    return totalCount;
  } catch (error) {
    console.error('Error counting coupons:', error);
    return 0;
  }
};

export const getAllCoupons = () => {
  try {
    const allOffers = [];
    if (sampleData?.all_coupons) {
      sampleData.all_coupons.forEach((couponGroup) => {
        if (couponGroup.offers) {
          couponGroup.offers.forEach((offer, index) => {
            allOffers.push({ 
              ...offer, 
              id: `${couponGroup.message_id || 'coupon'}_${index}`,
              isFavorite: false 
            });
          });
        }
      });
    }
    return allOffers;
  } catch (error) {
    console.error('Error loading coupons:', error);
    return [];
  }
};
