const { Client } = require('@googlemaps/google-maps-services-js');

const client = new Client({});

const calculateDistance = async (lat1, lon1, lat2, lon2) => {
  try {
    const response = await client.distancematrix({
      params: {
        origins: [{ lat: lat1, lng: lon1 }],
        destinations: [{ lat: lat2, lng: lon2 }],
        key: 'AIzaSyAHFoepvVjrlMUctcC4wn_VRpOznZBzmhA',
      },
    });
    const distanceInMeters = response.data.rows[0].elements[0].distance.value;
    return distanceInMeters / 1000; // Convert to kilometers
  } catch (error) {
    throw new Error('Failed to calculate distance: ' + error.message);
  }
};

module.exports = calculateDistance;