import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { useUser } from '@shared/data/queries/use-users';
import { Button } from '@shared/ui/button';
import { SelectableCard, SelectionDot, StepSubtitle, StepTitle } from '@shared/ui/card';
import { NavHeader } from '@shared/ui/header';
import { Screen } from '@shared/ui/screen';
import { Text } from '@shared/ui/text';

import { isReportReason, REPORT_REASONS, type ReportReason } from '../lib/reasons';

/** One reason: a title, the line that says what it covers, and the radio dot. */
function ReasonRow({
  title,
  detail,
  selected,
  onPress,
}: {
  title: string;
  detail: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <SelectableCard
      selected={selected}
      onPress={onPress}
      padding={{ vertical: 16, horizontal: 16 }}
      className="flex-row items-center gap-[12px] rounded-tile"
    >
      <View className="min-w-0 flex-1 gap-[3px]">
        <Text weight={600} className="text-[16.5px]">
          {title}
        </Text>
        <Text className="text-[14px] leading-[19.6px] text-ink-dim">{detail}</Text>
      </View>
      {/* A radio, so unlike the attendance check-list the resting dot stays on
          screen: the rows are one answer between them, not five answers. */}
      <SelectionDot selected={selected} />
    </SelectableCard>
  );
}

/**
 * Step one of a report: what happened.
 *
 * The reason can arrive already chosen — the attendance thank-you sends people
 * here with `no_show` — in which case this screen is a confirmation they can
 * change rather than a question. Nothing is selected by default otherwise, and
 * the button stays greyed until something is.
 */
export function ReportReasonScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    id,
    reason: preset,
    planId,
  } = useLocalSearchParams<{
    id: string;
    reason?: string;
    planId?: string;
  }>();
  const { data: user } = useUser(id ?? '');

  const [reason, setReason] = useState<ReportReason | undefined>(
    isReportReason(preset) ? preset : undefined,
  );

  const proceed = () => {
    if (!reason) return;
    const plan = planId ? `&planId=${planId}` : '';
    router.push(`/report/${id}/detail?reason=${reason}${plan}`);
  };

  return (
    <Screen>
      <NavHeader title={t('moderation.report.navTitle')} onBack={() => router.back()} />

      <View className="mt-[20px] shrink-0 gap-[10px]">
        <StepTitle>{t('moderation.report.title')}</StepTitle>
        <StepSubtitle>{t('moderation.report.subtitle', { name: user?.name ?? '' })}</StepSubtitle>
      </View>

      <ScrollView
        className="mt-[22px] min-h-0 flex-1"
        contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
        showsVerticalScrollIndicator={false}
      >
        {REPORT_REASONS.map((candidate) => (
          <ReasonRow
            key={candidate}
            title={t(`moderation.reasons.${candidate}.title`)}
            detail={t(`moderation.reasons.${candidate}.detail`)}
            selected={reason === candidate}
            onPress={() => setReason(candidate)}
          />
        ))}
      </ScrollView>

      <View className="mt-[16px] shrink-0">
        <Button label={t('common.continue')} disabled={!reason} onPress={proceed} />
      </View>
    </Screen>
  );
}
