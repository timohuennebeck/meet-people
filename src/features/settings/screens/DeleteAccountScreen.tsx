import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { useSession } from '@shared/providers/SessionProvider';
import {
  Button,
  NavHeader,
  Screen,
  SectionLabel,
  SelectionDot,
  Spacer,
  Text,
  TextButton,
  WarningNote,
} from '@shared/ui';

/** The things deletion takes with it, in the order the page names them. */
const LOSSES = ['plans', 'chats', 'badge'] as const;

/** One line of what deletion takes away: a red pip, a title and a consequence. */
function LossRow({ title, detail, divided }: { title: string; detail: string; divided?: boolean }) {
  return (
    <View
      className={
        divided
          ? 'flex-row items-start gap-[12px] border-t border-hair-soft py-[14px]'
          : 'flex-row items-start gap-[12px] py-[14px]'
      }
    >
      <View className="mt-[6px] h-[7px] w-[7px] shrink-0 rounded-full bg-danger" />
      <View className="min-w-0 flex-1 gap-[3px]">
        <Text weight={600} className="text-[15.5px]">
          {title}
        </Text>
        <Text className="text-[14px] leading-[19.6px] text-ink-dim">{detail}</Text>
      </View>
    </View>
  );
}

/**
 * Deleting the account. Reached from the destructive row in settings, it says
 * plainly what is lost before asking for a deliberate second act — the red
 * button stays out of reach until the acknowledgement is ticked — and keeps the
 * way back one tap away.
 */
export function DeleteAccountScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { signOut } = useSession();
  const [acknowledged, setAcknowledged] = useState(false);

  const remove = () => {
    // There is no account API yet, so deletion ends the session the way signing
    // out does: the router's guards then drop the user back at the welcome step.
    signOut();
    router.replace('/(onboarding)');
  };

  return (
    <Screen>
      <NavHeader title={t('settings.deleteAccountPage.title')} onBack={() => router.back()} />

      <View className="mt-[20px] shrink-0 gap-[8px]">
        <Text weight={600} className="text-[24px] leading-[27.6px] tracking-[-0.5px]">
          {t('settings.deleteAccountPage.heading')}
        </Text>
        <Text className="text-[15.5px] leading-[22.5px] text-ink-dim">
          {t('settings.deleteAccountPage.subtitle')}
        </Text>
      </View>

      <View className="mt-[20px] shrink-0 gap-[10px]">
        <SectionLabel>{t('settings.deleteAccountPage.lossLabel')}</SectionLabel>
        <View className="rounded-panel border border-hair bg-surface px-[16px]">
          {LOSSES.map((loss, index) => (
            <LossRow
              key={loss}
              divided={index > 0}
              title={t(`settings.deleteAccountPage.loss.${loss}.title`)}
              detail={t(`settings.deleteAccountPage.loss.${loss}.detail`)}
            />
          ))}
        </View>
      </View>

      <View className="mt-[16px] shrink-0">
        <WarningNote>{t('settings.deleteAccountPage.warning')}</WarningNote>
      </View>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: acknowledged }}
        onPress={() => setAcknowledged((previous) => !previous)}
        className="mt-[16px] shrink-0 flex-row items-center gap-[12px] active:opacity-60"
      >
        <SelectionDot selected={acknowledged} size={24} />
        <Text weight={500} className="flex-1 text-[14.5px] leading-[20.3px] text-ink-body">
          {t('settings.deleteAccountPage.acknowledge')}
        </Text>
      </Pressable>

      <Spacer min={16} />

      <View className="shrink-0 gap-[12px]">
        <Button
          label={t('settings.deleteAccountPage.confirm')}
          variant="danger"
          disabled={!acknowledged}
          onPress={remove}
        />
        <TextButton
          label={t('settings.deleteAccountPage.keep')}
          tone="bodyStrong"
          onPress={() => router.back()}
        />
      </View>
    </Screen>
  );
}
