import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { StepScaffold } from '@shared/components/step-scaffold';
import { useViewer } from '@shared/data/use-viewer';
import { STEPS } from '@shared/lib/steps';
import { useSession } from '@shared/providers/session-provider';
import { Button, Highlight, Mascot, StepTitle, Text, TextButton } from '@shared/ui';

/**
 * A short confirmation once the account exists.
 *
 * Whether it *is* a confirmation depends on the project: with e-mail
 * confirmations on, `signUp` creates the account but hands back no session
 * until the link in the e-mail is opened, and there is nothing to continue into
 * — every step after this one writes to a profile row that row-level security
 * will not open without a session. So the same step covers both endings, and
 * which one it shows is whether a session actually arrived.
 */
export function ConfirmationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated } = useSession();
  // `name` is step 9 and this is step 8, so a fresh account has not been named
  // yet and the greeting has nobody to greet. The design draws the name in a
  // tinted band, so the sentence splits around it when there is one and stands
  // on its own when there is not — rather than naming whoever the fixtures
  // happened to hold.
  const { data: viewer } = useViewer();
  const name = viewer?.name?.trim();

  if (!isAuthenticated) {
    return (
      <StepScaffold
        position={STEPS.confirmation}
        title={t('onboarding.confirmation.pendingTitle')}
        subtitle={t('onboarding.confirmation.pendingSubtitle')}
        footer={
          <Button
            label={t('onboarding.confirmation.pendingContinue')}
            onPress={() => router.replace('/(onboarding)/sign-in')}
          />
        }
      >
        <View className="min-h-0 flex-1 items-center justify-center">
          <Mascot size={232} />
        </View>
      </StepScaffold>
    );
  }

  return (
    <StepScaffold
      position={STEPS.confirmation}
      titleBlock={
        // `padding:2px 10px 4px · radius:10px` around the name, centred with
        // the words either side of it.
        //
        // The band is taller than the line it sits on, because CSS paints an
        // inline background over the font's whole content area — about 1.21em,
        // or 38.7px at 32px — not over the 34.56px line box. A `View` cannot
        // overflow its row that way, so it would push the subtitle and
        // everything under it 6px down the screen. The negative margin gives
        // the extra height back to the layout while the band keeps it.
        <View className="flex-row flex-wrap items-center justify-center gap-x-[9px]">
          {name ? (
            <>
              <StepTitle>{t('onboarding.confirmation.titleLead')}</StepTitle>
              <View className="flex-row items-center">
                <Highlight
                  className="-my-[5px] rounded-[10px] bg-brand-tint px-[10px] pb-[4px] pt-[2px]"
                  textClassName="text-[32px] leading-[38.7px] tracking-[-1.024px] text-brand"
                >
                  {name}
                </Highlight>
                <StepTitle>{t('onboarding.confirmation.titleTrail')}</StepTitle>
              </View>
            </>
          ) : (
            <StepTitle>{t('onboarding.confirmation.titleSolo')}</StepTitle>
          )}
        </View>
      }
      footer={
        <>
          <Button label={t('common.continue')} onPress={() => router.push('/(onboarding)/name')} />
          <TextButton label={t('onboarding.confirmation.manageAccount')} className="mt-[15px]" />
        </>
      }
    >
      <Text className="mt-[12px] shrink-0 text-center text-[15.5px] leading-[22.5px] text-ink-dim">
        {t('onboarding.confirmation.subtitle')}
      </Text>

      <View className="min-h-0 flex-1 items-center justify-center">
        <Mascot size={232} />
      </View>
    </StepScaffold>
  );
}
