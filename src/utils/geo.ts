// export const OFFICE_LAT = 14.942155;
// export const OFFICE_LNG = 120.217151;
// export const ALLOWED_RADIUS_METERS = 50; // The employee must be within 50 meters

// The Haversine Formula: Calculates the distance between two points on a sphere
export const getDistanceFromLatLonInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Radius of the Earth in meters
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

const deg2rad = (deg: number) => {
  return deg * (Math.PI / 180);
};


export const isWithinSmartZone = (userLat: number, userLng: number, officeLat: number, officeLng: number, allowedRadius: number) => {

  
  const distance = getDistanceFromLatLonInMeters(userLat, userLng, officeLat, officeLng);
  return distance <= allowedRadius;
};