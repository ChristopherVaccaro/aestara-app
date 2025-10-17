/**
 * Capacitor Utilities for Mobile App Integration
 * Provides native mobile functionality through Capacitor plugins
 */

import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Share } from '@capacitor/share';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';

/**
 * Check if app is running on a native platform
 */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Check if app is running on Android
 */
export const isAndroid = (): boolean => {
  return Capacitor.getPlatform() === 'android';
};

/**
 * Initialize app for mobile platform
 */
export const initializeMobileApp = async (): Promise<void> => {
  if (!isNativePlatform()) return;

  try {
    // Configure status bar
    if (isAndroid()) {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#1a1a1a' });
    }

    // Hide splash screen after app is ready
    await SplashScreen.hide();
  } catch (error) {
    console.error('Error initializing mobile app:', error);
  }
};

/**
 * Share image using native share dialog
 */
export const shareImageNative = async (
  imageUrl: string,
  title: string = 'Check out my styled image!'
): Promise<boolean> => {
  if (!isNativePlatform()) {
    return false;
  }

  try {
    // Convert data URL to base64 if needed
    let base64Data = imageUrl;
    if (imageUrl.startsWith('data:image')) {
      base64Data = imageUrl.split(',')[1];
    }

    // Save to temporary file
    const fileName = `styled-image-${Date.now()}.png`;
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Cache,
    });

    // Share the file
    await Share.share({
      title: title,
      text: 'Created with AI Image Stylizer',
      url: savedFile.uri,
      dialogTitle: 'Share your styled image',
    });

    return true;
  } catch (error) {
    console.error('Error sharing image:', error);
    return false;
  }
};

/**
 * Open camera to take a photo
 */
export const takePicture = async (): Promise<File | null> => {
  if (!isNativePlatform()) {
    return null;
  }

  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });

    if (!image.dataUrl) {
      return null;
    }

    // Convert data URL to File object
    const response = await fetch(image.dataUrl);
    const blob = await response.blob();
    const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });

    return file;
  } catch (error) {
    console.error('Error taking picture:', error);
    return null;
  }
};

/**
 * Pick image from gallery
 */
export const pickImageFromGallery = async (): Promise<File | null> => {
  if (!isNativePlatform()) {
    return null;
  }

  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
    });

    if (!image.dataUrl) {
      return null;
    }

    // Convert data URL to File object
    const response = await fetch(image.dataUrl);
    const blob = await response.blob();
    const file = new File([blob], `gallery-${Date.now()}.jpg`, { type: 'image/jpeg' });

    return file;
  } catch (error) {
    console.error('Error picking image:', error);
    return null;
  }
};

/**
 * Save image to device gallery
 */
export const saveImageToGallery = async (imageUrl: string): Promise<boolean> => {
  if (!isNativePlatform()) {
    return false;
  }

  try {
    // Convert data URL to base64 if needed
    let base64Data = imageUrl;
    if (imageUrl.startsWith('data:image')) {
      base64Data = imageUrl.split(',')[1];
    }

    // Save to documents directory
    const fileName = `ai-stylizer-${Date.now()}.png`;
    await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Documents,
    });

    return true;
  } catch (error) {
    console.error('Error saving image:', error);
    return false;
  }
};

/**
 * Request camera permissions
 */
export const requestCameraPermissions = async (): Promise<boolean> => {
  if (!isNativePlatform()) {
    return true;
  }

  try {
    const permissions = await Camera.requestPermissions();
    return permissions.camera === 'granted' && permissions.photos === 'granted';
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
};
