import type { ScanEntry } from "./data";
import {
  requestAllPermissions,
  analyzeContacts,
  analyzePhotos,
  analyzeLocation,
  type DeviceScanData,
  type ContactAnalysis,
  type PhotoAnalysis,
  type LocationAnalysis,
} from "./device-scan";
import { Platform } from "react-native";

export type ScanLogCallback = (entry: ScanEntry) => void;

/**
 * Performs a real device scan, streaming log entries to the callback
 * in the same format as the simulated buildDeviceScanLog().
 * Returns the aggregated scan data for API submission.
 */
export async function performRealDeviceScan(
  onLogEntry: ScanLogCallback
): Promise<DeviceScanData> {
  let contacts: ContactAnalysis | null = null;
  let photos: PhotoAnalysis | null = null;
  let location: LocationAnalysis | null = null;

  const emit = (entry: ScanEntry) => {
    onLogEntry(entry);
  };

  // Phase 0: Permissions
  emit({ text: "Requesting device permissions...", type: "sys", ms: 0, phase: 0 });

  const perms = await requestAllPermissions();
  const granted = Object.entries(perms)
    .filter(([, v]) => v)
    .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1));

  emit({
    text: granted.length > 0
      ? `Access granted: ${granted.join(", ")}`
      : "Limited access. Proceeding with available data.",
    type: "sys",
    ms: 800,
    phase: 0,
  });

  // Phase 1: Messages (contacts as proxy for messaging patterns)
  if (perms.contacts) {
    emit({ text: "Scanning contacts and messaging patterns...", type: "scan", ms: 1600, phase: 1 });

    contacts = await analyzeContacts();

    if (contacts) {
      emit({
        text: `${contacts.totalContacts.toLocaleString()} contacts indexed`,
        type: "scan",
        ms: 2400,
        phase: 1,
      });
      emit({
        text: `${contacts.withPhone} with phone, ${contacts.withEmail} with email`,
        type: "filter",
        ms: 3000,
        phase: 1,
      });
      emit({
        text: `Response priority: ${contacts.frequencyCategories.innerCircle} people in inner circle`,
        type: "filter",
        ms: 3600,
        phase: 1,
      });
    }
  } else {
    emit({ text: "Contacts access denied. Skipping messaging analysis.", type: "sys", ms: 1600, phase: 1 });
  }

  // Phase 2: Social graph
  emit({ text: "Mapping social connections...", type: "scan", ms: 4200, phase: 2 });

  if (contacts) {
    const { innerCircle, outerCircle, acquaintances } = contacts.frequencyCategories;
    emit({
      text: `Social radius: inner circle ${innerCircle}, outer ~${outerCircle}, acquaintances ~${acquaintances}`,
      type: "filter",
      ms: 5000,
      phase: 2,
    });
    emit({
      text: contacts.withImage > contacts.totalContacts * 0.3
        ? "High engagement: many contacts have photos attached"
        : "Selective engagement: curated contact list",
      type: "filter",
      ms: 5600,
      phase: 2,
    });
  }

  // Phase 3: Media
  if (perms.media) {
    emit({ text: "Analyzing camera roll and saved content...", type: "scan", ms: 6200, phase: 3 });

    photos = await analyzePhotos();

    if (photos) {
      emit({
        text: `${photos.totalPhotos.toLocaleString()} photos, ${photos.totalVideos.toLocaleString()} videos`,
        type: "scan",
        ms: 7000,
        phase: 3,
      });
      emit({
        text: `${photos.monthlyAverage} photos/month average. ${photos.locationClusters} location clusters detected.`,
        type: "filter",
        ms: 7600,
        phase: 3,
      });
      emit({
        text: photos.monthlyAverage > 50
          ? "Active visual documenter. Experience-oriented lifestyle."
          : "Selective photographer. Values quality over quantity.",
        type: "filter",
        ms: 8200,
        phase: 3,
      });
    }
  } else {
    emit({ text: "Media access denied. Skipping visual analysis.", type: "sys", ms: 6200, phase: 3 });
  }

  // Phase 4: Behavior (location patterns)
  if (perms.location) {
    emit({ text: "Analyzing location patterns...", type: "scan", ms: 8800, phase: 4 });

    location = await analyzeLocation();

    if (location) {
      const locationDesc = location.city
        ? `${location.city}, ${location.region || ""}`
        : "Location acquired";
      emit({
        text: `Current area: ${locationDesc}`,
        type: "filter",
        ms: 9400,
        phase: 4,
      });
    }
  } else {
    emit({ text: "Location access denied. Skipping location analysis.", type: "sys", ms: 8800, phase: 4 });
  }

  // Phase 5: Intent classification
  emit({ text: "Classifying relationship intent from behavioral data...", type: "intent", ms: 10000, phase: 5 });

  const dataPointCount = (contacts?.totalContacts || 0) +
    (photos?.totalPhotos || 0) +
    (location ? 1 : 0);

  emit({ text: "Emotional investment in relationships: analyzing...", type: "intent", ms: 10600, phase: 5 });
  emit({
    text: `Behavioral data points collected: ${dataPointCount.toLocaleString()}`,
    type: "intent",
    ms: 11200,
    phase: 5,
  });
  emit({ text: "INTENT CLASSIFICATION: PENDING SERVER ANALYSIS", type: "done", ms: 11800, phase: 5 });

  // Phase 6: Synthesis
  emit({
    text: `Cross-referencing ${dataPointCount.toLocaleString()} behavioral data points...`,
    type: "sys",
    ms: 12400,
    phase: 6,
  });
  emit({ text: "Sending anonymized data for personality model construction...", type: "sys", ms: 13000, phase: 6 });
  emit({ text: "DEVICE SCAN COMPLETE", type: "done", ms: 13600, phase: 6 });

  return {
    contacts,
    photos,
    location,
    platform: Platform.OS,
    deviceTimestamp: new Date().toISOString(),
  };
}
