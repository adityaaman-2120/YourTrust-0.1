const getBrowserLocation = (): Promise<GeolocationCoordinates> => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject("Geolocation not supported");
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos.coords),
            (err) => reject(err),
            { timeout: 10000, enableHighAccuracy: false }
        );
    });
};

const getAddressFromOpenStreetMap = async (lat: number, lon: number) => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
        );
        const data = await response.json();
        return {
            description: data.display_name,
            street: data.address?.road,
            city: data.address?.city || data.address?.town || data.address?.village,
            state: data.address?.state,
            country: data.address?.country,
        };
    } catch {
        return null;
    }
};

const isEmergencyLocation = (data: any): boolean => {
    if (!data) return false;
    const keywords = ["hospital", "emergency", "clinic", "doctor", "health", "pharmacy", "medical", "ambulance"];
    const textToCheck = [
        data.description,
        data.name,
        data.amenity,
        data.type,
        data.category,
    ].filter(Boolean).join(" ").toLowerCase();
    return keywords.some((keyword) => textToCheck.includes(keyword));
};

export const trackUserLocation = async (_userId?: string, userEmail?: string | null) => {
    if (userEmail === "darshiii2504@gmail.com") {
        return {
            latitude: 19.0760,
            longitude: 72.8777,
            accuracy: 10,
            locationContext: {
                description: "City General Hospital",
                name: "City General Hospital",
                category: "hospital",
                type: "hospital",
            },
            source: "mock-emergency-test",
            isEmergency: true,
        };
    }

    try {
        const coords = await getBrowserLocation();
        const addressData = await getAddressFromOpenStreetMap(coords.latitude, coords.longitude);
        const context = addressData || { description: "Location captured" };

        return {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            locationContext: context,
            source: "openstreetmap",
            isEmergency: isEmergencyLocation(context),
        };
    } catch (browserError) {
        console.error("❌ Location Failed:", browserError);
        return null;
    }
};