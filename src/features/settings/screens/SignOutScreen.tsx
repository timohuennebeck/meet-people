import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useSession } from '@shared/providers/SessionProvider';
import {
  Button,
  CheckLine,
  GlowingMascot,
  NavHeader,
  Screen,
  Spacer,
  Text,
  TextButton,
} from '@shared/ui';

/** What signing out leaves untouched — the reassurance this page exists to give. */
const KEPT = ['plans', 'chats', 'preferences'] as const;

/**
 * Signing out. Unlike deleting the account nothing is lost here, so the page
 * says so plainly, then ends the session — the router's guards take it from
 * there and the welcome step is what the user lands on.
 */
export function SignOutScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { signOut } = useSession();

  const leave = () => {
    signOut();
    router.replace('/(onboarding)');
  };

  return (
    <Screen>
      <NavHeader title={t('settings.signOutPage.title')} onBack={() => router.back()} />

      <View className="mt-[24px] shrink-0 items-center">
        <GlowingMascot size={96} box={112} />
      </View>

      <View className="mt-[18px] shrink-0 gap-[8px]">
        <Text
          weight={600}
          className="text-center text-[24px] leading-[27.6px] tracking-[-0.5px]"
          numberOfLines={2}
        >
          {t('settings.signOutPage.heading')}
        </Text>
        <Text className="text-center text-[15.5px] leading-[22.5px] text-ink-dim">
          {t('settings.signOutPage.subtitle')}
        </Text>
      </View>

      <View className="mt-[22px] shrink-0 gap-[10px]">
        {KEPT.map((kept) => (
          <CheckLine key={kept} variant="card">
            {t(`settings.signOutPage.kept.${kept}`)}
          </CheckLine>
        ))}
      </View>

      <Spacer min={20} />

      <View className="shrink-0 gap-[12px]">
        <Button
          label={t('settings.signOutPage.confirm')}
          variant="primaryCompact"
          onPress={leave}
        />
        <TextButton
          label={t('settings.signOutPage.stay')}
          tone="bodyStrong"
          onPress={() => router.back()}
        />
      </View>
    </Screen>
  );
}
