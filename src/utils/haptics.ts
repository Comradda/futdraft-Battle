// Tactile feedback helper for mobile Safari & devices
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' = 'light') {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'heavy':
          navigator.vibrate(50);
          break;
        case 'success':
          navigator.vibrate([15, 30, 25]);
          break;
        case 'warning':
          navigator.vibrate([30, 40, 30, 40]);
          break;
      }
    } catch {
      // Ignore vibration error on unsupported iOS versions
    }
  }
}
