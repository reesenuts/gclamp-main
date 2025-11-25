import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform, Linking, Alert } from "react-native";
import Constants from "expo-constants";

export type FileSystemUnavailableReason = "expo-go" | "unavailable";

export class FileSystemUnavailableError extends Error {
  reason: FileSystemUnavailableReason;

  constructor(reason: FileSystemUnavailableReason) {
    super("File system access is not available");
    this.reason = reason;
  }
}

/**
 * Returns a writable directory for temporary files (cache first, document fallback).
 * Throws a FileSystemUnavailableError when running inside Expo Go or when the native
 * file system cannot be reached.
 */
export const getWritableDirectory = async (): Promise<string> => {
  const directory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? null;

  if (!directory) {
    const reason: FileSystemUnavailableReason =
      Constants.appOwnership === "expo" ? "expo-go" : "unavailable";
    throw new FileSystemUnavailableError(reason);
  }

  await ensureDirectoryExists(directory);
  return directory;
};

const ensureDirectoryExists = async (directory: string) => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(directory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    }
  } catch {
    // Directory might already exist or cannot be created; let callers handle errors later.
  }
};

/**
 * Saves a file to the device, giving the user options to open, save to Downloads, or share.
 * On Android, the file is saved to app storage and user can choose to open, share (which includes "Save to Files"), or save to Downloads via file manager.
 * On iOS, opens the share sheet which includes "Save to Files" option.
 */
export const saveFileToDevice = async (
  fileUri: string,
  filename: string,
  mimeType: string
): Promise<void> => {
  if (Platform.OS === "android") {
    // On Android, show an alert with options
    Alert.alert(
      "File Downloaded",
      `File saved: ${filename}\n\nWhat would you like to do?`,
      [
        {
          text: "Open File",
          onPress: async () => {
            try {
              // Get content URI for Android
              const contentUri = await FileSystem.getContentUriAsync(fileUri);
              // Open the file with default app
              await Linking.openURL(contentUri);
            } catch (err) {
              console.error("Error opening file:", err);
              // Fallback to sharing
              const isAvailable = await Sharing.isAvailableAsync();
              if (isAvailable) {
                await Sharing.shareAsync(fileUri, { mimeType, dialogTitle: `Open ${filename}` });
              }
            }
          },
        },
        {
          text: "Save to Downloads",
          onPress: async () => {
            // For saving to Downloads, we'll use the share sheet
            // Users can select "Save to Files" or their file manager from the share options
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
              await Sharing.shareAsync(fileUri, {
                mimeType,
                dialogTitle: `Save ${filename} to Downloads`,
              });
            } else {
              Alert.alert(
                "File Saved",
                `File saved to app storage.\n\nTo save to Downloads:\n1. Use "Share" option\n2. Select "Save to Files" or your file manager\n3. Choose Downloads folder`
              );
            }
          },
        },
        {
          text: "Share",
          onPress: async () => {
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
              await Sharing.shareAsync(fileUri, { mimeType, dialogTitle: `Share ${filename}` });
            } else {
              Alert.alert("Success", `File saved to: ${fileUri}`);
            }
          },
        },
        { text: "Done", style: "cancel" },
      ]
    );
  } else {
    // On iOS, use share sheet which includes "Save to Files" option
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, { mimeType, dialogTitle: `Save ${filename}` });
    } else {
      Alert.alert("Success", `File saved to: ${fileUri}`);
    }
  }
};

