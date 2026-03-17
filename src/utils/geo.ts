export const OFFICE_LAT = 14.88; 
export const OFFICE_LNG = 120.28;
export const ALLOWED_RADIUS_METERS = 50; // The employee must be within 50 meters

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

// YOUR MISSION GOES HERE:
export const isWithinSmartZone = (userLat: number, userLng: number) => {

    const distance = getDistanceFromLatLonInMeters(userLat, userLng, OFFICE_LAT, OFFICE_LNG);
    return distance <= ALLOWED_RADIUS_METERS;
      
    
    
  // 1. Call the 'getDistanceFromLatLonInMeters' function using the user's location and the OFFICE location.
  // 2. Save the result in a variable called 'distance'.
  // 3. Write an 'if' statement: If 'distance' is less than or equal to ALLOWED_RADIUS_METERS, return true.
  // 4. Else, return false.
};