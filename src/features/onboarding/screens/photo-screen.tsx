import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { StepScaffold } from '@shared/components/step-scaffold';
import { STEPS } from '@shared/lib/steps';
import { Button, Text, TextButton } from '@shared/ui';

import { saveAvatar } from '../lib/profile-writes';

/**
 * One square photo, cropped by the system picker so what is chosen is what the
 * round frame shows.
 */
const PICK = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.9,
} satisfies ImagePicker.ImagePickerOptions;

/** Why no photo arrived — only ever shown after the user asked for one. */
type Notice = 'cameraDenied' | 'failed';

/**
 * The grey bust that stands in for a portrait before one is chosen: a head
 * circle and a shoulders dome, clipped to a 214px round frame.
 */
function PortraitPlaceholder() {
  return (
    <View className="relative h-full w-full overflow-hidden rounded-full bg-[#D8DCE2]">
      <View className="absolute left-1/2 top-[52px] h-[62px] w-[62px] -translate-x-1/2 rounded-full bg-[#B4BAC2]" />
      <View className="absolute left-1/2 top-[128px] h-[104px] w-[122px] -translate-x-1/2 rounded-t-[61px] bg-[#B4BAC2]" />
    </View>
  );
}

/** A profile photo. Skippable, but flagged as worth doing. */
export function PhotoScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [photo, setPhoto] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  /**
   * The upload starts here rather than on the pick, so choosing three photos
   * in a row only ever sends the one kept. Nothing waits for it: the row is
   * pointed at the object once it is there, and a failure leaves the profile
   * without a photo rather than with a path to nothing.
   */
  const next = () => {
    if (photo) saveAvatar(photo);
    router.push('/(onboarding)/verification');
  };

  /** Keeps the first asset of a finished pick; a cancelled one changes nothing. */
  const keep = (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled) return;
    const picked = result.assets[0];
    if (picked) {
      setPhoto(picked.uri);
      setNotice(null);
    }
  };

  const chooseFromGallery = async () => {
    // iOS hands over one picked photo without any library permission at all, so
    // none is asked for here.
    try {
      keep(await ImagePicker.launchImageLibraryAsync(PICK));
    } catch (error) {
      console.warn('Could not open the photo library', error);
      setNotice('failed');
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setNotice('cameraDenied');
        return;
      }
      keep(await ImagePicker.launchCameraAsync(PICK));
    } catch (error) {
      // No camera on this device, or no native module behind it.
      console.warn('Could not open the camera', error);
      setNotice('failed');
    }
  };

  return (
    <StepScaffold
      position={STEPS.photo}
      className="bg-surface"
      footer={
        <>
          <Button
            label={photo ? t('common.continue') : t('onboarding.photo.takePhoto')}
            onPress={photo ? next : () => void takePhoto()}
          />
          <Button
            label={t('onboarding.photo.chooseFromGallery')}
            variant="secondary"
            className="mt-[12px]"
            onPress={() => void chooseFromGallery()}
          />
          <TextButton label={t('common.notNow')} className="mt-[14px]" onPress={next} />
        </>
      }
    >
      <View className="min-h-0 flex-1 items-center justify-center gap-[26px]">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(
            photo ? 'onboarding.photo.changePhoto' : 'onboarding.photo.addPhoto',
          )}
          onPress={() => void chooseFromGallery()}
          className="h-[214px] w-[214px] rounded-full bg-surface p-[8px]"
        >
          {photo ? (
            <Image
              source={{ uri: photo }}
              className="h-full w-full rounded-full"
              contentFit="cover"
            />
          ) : (
            <PortraitPlaceholder />
          )}
        </Pressable>
        <View className="max-w-[290px] items-center">
          <Text weight={600} className="text-center text-[30px] leading-[33px] tracking-[-0.96px]">
            {t('onboarding.photo.title')}
          </Text>
          <Text className="mt-[10px] text-center text-[15.5px] leading-[22.5px] text-ink-dim">
            {t('onboarding.photo.subtitle')}
          </Text>
          {notice ? (
            <Text className="mt-[10px] text-center text-[13.5px] leading-[19px] text-danger">
              {t(
                notice === 'cameraDenied'
                  ? 'onboarding.photo.cameraDenied'
                  : 'onboarding.photo.pickFailed',
              )}
            </Text>
          ) : null}
        </View>
      </View>
    </StepScaffold>
  );
}
