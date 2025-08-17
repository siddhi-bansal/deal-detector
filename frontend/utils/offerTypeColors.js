// Centralized color scheme for offer types
export const getOfferTypeColors = (offerType) => {
  const colorSchemes = {
    'discount': {
      background: '#dcfce7',    // Light green
      border: '#16a34a',        // Dark green
      text: '#15803d',          // Medium green
      gradient: ['#22c55e', '#16a34a']
    },
    'coupon': {
      background: '#dbeafe',    // Light blue
      border: '#2563eb',        // Dark blue
      text: '#1d4ed8',          // Medium blue
      gradient: ['#3b82f6', '#1d4ed8']
    },
    'free_shipping': {
      background: '#fed7aa',    // Light orange
      border: '#ea580c',        // Dark orange
      text: '#c2410c',          // Medium orange
      gradient: ['#f59e0b', '#d97706']
    },
    'bogo': {
      background: '#fce7f3',    // Light pink
      border: '#db2777',        // Dark pink
      text: '#be185d',          // Medium pink
      gradient: ['#ec4899', '#dc2626']
    },
    'free_gift': {
      background: '#cffafe',    // Light cyan
      border: '#0891b2',        // Dark cyan
      text: '#0e7490',          // Medium cyan
      gradient: ['#06b6d4', '#0891b2']
    },
    'loyalty_points': {
      background: '#fef2f2',    // Light red
      border: '#dc2626',        // Dark red
      text: '#b91c1c',          // Medium red
      gradient: ['#ef4444', '#dc2626']
    }
  };

  return colorSchemes[offerType] || {
    background: '#f3f4f6',      // Default light gray
    border: '#6b7280',          // Default gray
    text: '#4b5563',            // Default dark gray
    gradient: ['#10b981', '#059669'] // Default emerald
  };
};

export const getOfferTypeLabel = (offerType) => {
  const labels = {
    'discount': 'Discount',
    'coupon': 'Coupon',
    'free_shipping': 'Free Ship',
    'bogo': 'BOGO',
    'free_gift': 'Free Gift',
    'loyalty_points': 'Points'
  };
  
  return labels[offerType] || offerType?.replace('_', ' ')?.toUpperCase() || 'OFFER';
};

export const getOfferTypeIcon = (offerType) => {
  const icons = {
    'discount': 'pricetag',
    'coupon': 'ticket',
    'free_shipping': 'car',
    'bogo': 'copy',
    'free_gift': 'gift',
    'loyalty_points': 'star'
  };
  
  return icons[offerType] || 'pricetag';
};
