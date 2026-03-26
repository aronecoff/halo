import { Platform } from "react-native";

// === Safe module imports (gracefully degrade in Expo Go) ===

let Contacts: any = null;
let MediaLibrary: any = null;
let Location: any = null;

try { Contacts = require("expo-contacts"); } catch {}
try { MediaLibrary = require("expo-media-library"); } catch {}
try { Location = require("expo-location"); } catch {}

// === Permission Requests ===

export async function requestAllPermissions() {
  const results: Record<string, boolean> = {};

  try {
    if (Contacts) {
      const { status } = await Contacts.requestPermissionsAsync();
      results.contacts = status === "granted";
    } else {
      results.contacts = false;
    }
  } catch {
    results.contacts = false;
  }

  try {
    if (MediaLibrary) {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      results.media = status === "granted";
    } else {
      results.media = false;
    }
  } catch {
    results.media = false;
  }

  try {
    if (Location) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      results.location = status === "granted";
    } else {
      results.location = false;
    }
  } catch {
    results.location = false;
  }

  return results;
}

// === Contact Analysis ===

export interface ContactAnalysis {
  totalContacts: number;
  withPhone: number;
  withEmail: number;
  withImage: number;
  frequencyCategories: {
    innerCircle: number;
    outerCircle: number;
    acquaintances: number;
  };
}

export async function analyzeContacts(): Promise<ContactAnalysis | null> {
  if (!Contacts) return null;

  try {
    const { status } = await Contacts.getPermissionsAsync();
    if (status !== "granted") return null;

    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Emails,
        Contacts.Fields.ImageAvailable,
      ],
    });

    const totalContacts = data.length;
    let withPhone = 0;
    let withEmail = 0;
    let withImage = 0;
    let innerCircle = 0;
    let outerCircle = 0;
    let acquaintances = 0;

    for (const contact of data) {
      const hasPhone = (contact.phoneNumbers?.length ?? 0) > 0;
      const hasEmail = (contact.emails?.length ?? 0) > 0;
      const hasImage = contact.imageAvailable === true;

      if (hasPhone) withPhone++;
      if (hasEmail) withEmail++;
      if (hasImage) withImage++;

      if (hasPhone && hasEmail && hasImage) {
        innerCircle++;
      } else if (hasPhone || hasEmail) {
        outerCircle++;
      } else {
        acquaintances++;
      }
    }

    return {
      totalContacts,
      withPhone,
      withEmail,
      withImage,
      frequencyCategories: { innerCircle, outerCircle, acquaintances },
    };
  } catch {
    return null;
  }
}

// === Photo Analysis ===

export interface PhotoAnalysis {
  totalPhotos: number;
  totalVideos: number;
  oldestDate: string | null;
  newestDate: string | null;
  monthlyAverage: number;
  locationClusters: number;
  hasScreenshots: boolean;
}

export async function analyzePhotos(): Promise<PhotoAnalysis | null> {
  if (!MediaLibrary) return null;

  try {
    const { status } = await MediaLibrary.getPermissionsAsync();
    if (status !== "granted") return null;

    const photosPage = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.photo,
      first: 1,
    });
    const videosPage = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.video,
      first: 1,
    });

    const totalPhotos = photosPage.totalCount;
    const totalVideos = videosPage.totalCount;

    let oldestDate: string | null = null;
    let newestDate: string | null = null;
    let locationClusters = 0;

    const oldest = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.photo,
      first: 1,
      sortBy: [MediaLibrary.SortBy.creationTime],
    });
    if (oldest.assets.length > 0) {
      oldestDate = new Date(oldest.assets[0].creationTime).toISOString();
    }

    const newest = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.photo,
      first: 1,
      sortBy: [[MediaLibrary.SortBy.creationTime, false]],
    });
    if (newest.assets.length > 0) {
      newestDate = new Date(newest.assets[0].creationTime).toISOString();
    }

    let monthlyAverage = 0;
    if (oldestDate && newestDate) {
      const months = Math.max(
        1,
        (new Date(newestDate).getTime() - new Date(oldestDate).getTime()) /
          (1000 * 60 * 60 * 24 * 30)
      );
      monthlyAverage = Math.round(totalPhotos / months);
    }

    const locationSample = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.photo,
      first: 100,
      sortBy: [[MediaLibrary.SortBy.creationTime, false]],
    });

    const locationSet = new Set<string>();
    for (const asset of locationSample.assets) {
      if (asset.location) {
        const key = `${Math.round(asset.location.latitude * 100) / 100},${
          Math.round(asset.location.longitude * 100) / 100
        }`;
        locationSet.add(key);
      }
    }
    locationClusters = locationSet.size;

    const albums = await MediaLibrary.getAlbumsAsync();
    const hasScreenshots = albums.some(
      (a: any) => a.title.toLowerCase() === "screenshots"
    );

    return {
      totalPhotos,
      totalVideos,
      oldestDate,
      newestDate,
      monthlyAverage,
      locationClusters,
      hasScreenshots,
    };
  } catch {
    return null;
  }
}

// === Location Analysis ===

export interface LocationAnalysis {
  currentLatitude: number;
  currentLongitude: number;
  city: string | null;
  region: string | null;
}

export async function analyzeLocation(): Promise<LocationAnalysis | null> {
  if (!Location) return null;

  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") return null;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    let city: string | null = null;
    let region: string | null = null;

    try {
      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      if (geocode) {
        city = geocode.city || null;
        region = geocode.region || null;
      }
    } catch {
      // Geocoding may fail, continue without it
    }

    return {
      currentLatitude: location.coords.latitude,
      currentLongitude: location.coords.longitude,
      city,
      region,
    };
  } catch {
    return null;
  }
}

// === Aggregate Scan Data ===

export interface DeviceScanData {
  contacts: ContactAnalysis | null;
  photos: PhotoAnalysis | null;
  location: LocationAnalysis | null;
  platform: string;
  deviceTimestamp: string;
}

export async function performFullDeviceScan(): Promise<DeviceScanData> {
  const [contacts, photos, location] = await Promise.all([
    analyzeContacts().catch(() => null),
    analyzePhotos().catch(() => null),
    analyzeLocation().catch(() => null),
  ]);

  return {
    contacts,
    photos,
    location,
    platform: Platform.OS,
    deviceTimestamp: new Date().toISOString(),
  };
}
