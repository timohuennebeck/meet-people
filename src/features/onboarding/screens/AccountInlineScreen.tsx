import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { StepScaffold } from '@shared/components/StepScaffold';
import { STEPS } from '@shared/lib/steps';
import { Button, Glyph, Spacer, Text, TextField } from '@shared/ui';

import { LegalNote } from '../ui/LegalNote';

/** `13px/600 · .06em tracking` — the label above each field on this variant. */
function FieldLabel({ children }: { children: string }) {
  return (
    <Text weight={600} className="text-[13px] tracking-[0.78px] text-ink-ghost">
      {children}
    </Text>
  );
}

/**
 * The alternate account step (design option 6b): Google on top, a divider, then
 * e-mail and password inline rather than on a following screen.
 *
 * It is an alternative to `AccountScreen`, not a step after it — the design
 * offers both layouts for the same point in the flow. The default flow uses
 * `AccountScreen`; this route exists so the variant can be compared and swapped
 * in without rebuilding it.
 */
export function AccountInlineScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <StepScaffold
      position={STEPS.account}
      title={t('onboarding.account.title')}
      subtitle={t('onboarding.account.subtitle')}
      footer={<LegalNote />}
    >
      <Button
        label={t('onboarding.account.withGoogle')}
        variant="secondaryTall"
        className="mt-[22px]"
        icon={<Glyph.GoogleGlyph size={19} />}
        onPress={() => router.push('/(onboarding)/confirmation')}
      />

      <View className="mt-[22px] shrink-0 flex-row items-center gap-[12px]">
        <View className="h-[1px] flex-1 bg-hair-mid" />
        <Text className="text-[14px] text-ink-ghost">{t('common.or')}</Text>
        <View className="h-[1px] flex-1 bg-hair-mid" />
      </View>

      <View className="mt-[22px] shrink-0 gap-[14px]">
        <View className="gap-[7px]">
          <FieldLabel>{t('onboarding.account.emailLabel')}</FieldLabel>
          <TextField value="sara@" focused caret />
        </View>

        <View className="gap-[7px]">
          <FieldLabel>{t('onboarding.account.passwordLabel')}</FieldLabel>
          <TextField placeholder={t('onboarding.account.passwordPlaceholder')} />
        </View>
      </View>

      <Button
        label={t('onboarding.account.createAccount')}
        className="mt-[18px]"
        onPress={() => router.push('/(onboarding)/confirmation')}
      />

      <Spacer min={14} />
    </StepScaffold>
  );
}
