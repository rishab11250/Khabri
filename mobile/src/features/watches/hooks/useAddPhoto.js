import { useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { useSessionStore } from '@/store/session';

export function useAddPhoto() {
  const { t } = useTranslation();
  const router = useRouter();
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const setPhotoResult = useSessionStore((s) => s.setPhotoResult);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const scanAsset = async (asset) => {
    setBusy(true);
    setError('');
    try {
      const data = await api.intakePhoto(asset);
      setPhotoResult(data);
      router.push('/add/result');
    } catch (err) {
      setError(err?.message || t('common.errorGeneric'));
    } finally {
      setBusy(false);
    }
  };

  const capturePhoto = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
    if (photo?.uri) {
      await scanAsset({ uri: photo.uri, mimeType: 'image/jpeg', fileName: 'notice.jpg' });
    }
  };

  const pickFromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.[0]) {
      await scanAsset(res.assets[0]);
    }
  };

  return {
    cameraRef,
    permission,
    requestPermission,
    busy,
    error,
    capturePhoto,
    pickFromGallery,
  };
}
