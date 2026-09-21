import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { isDataError } from '@shared/data/errors';
import { usePublishPlan } from '@shared/data/queries/use-plans';
import { AgeRangeControl, AGE_MAX, AGE_MIN, type AgeRange } from '@shared/ui/age-range-control';
import { Button, Spacer, TextButton } from '@shared/ui/button';
import { Text } from '@shared/ui/text';

import { useCreatePlan } from '../../lib/create-plan-provider';
import { CreateStepLayout } from '../../ui/create-step-layout';

/** Create step 7 — an optional age range for the plan, then publish. */
export function CreateAudienceScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { draft } = useCreatePlan();
  const [range, setRange] = useState<AgeRange>([21, 34]);
  const { mutate: publishPlan, isPending, error } = usePublishPlan();

  /**
   * `ageRange` is passed rather than read back off `range`, because "Aberto
   * para todas as idades" sets it and publishes in the same tap — and the state
   * it set is not on this render yet.
   */
  const publish = (ageRange: AgeRange | null) => {
    if (isPending || !draft.place || draft.title.trim().length === 0) return;

    publishPlan(
      {
        title: draft.title,
        placeId: draft.place.id,
        startsAt: draft.startsAt.toISOString(),
        durationMinutes: draft.durationMinutes,
        joinMode: draft.joinMode,
        languages: draft.languages,
        seats: draft.seats,
        ageRange,
      },
      // Replaces, so the back gesture on the confirmation cannot land on a
      // step whose answers have already become a row.
      { onSuccess: (plan) => router.replace(`/create/published?id=${plan.id}`) },
    );
  };

  // A refusal the database named — an unverified host on an uncapped event —
  // says so; anything else gets the one sentence this screen can offer.
  const refusal = error
    ? isDataError(error)
      ? t(error.messageKey)
      : t('errors.publishFailed')
    : null;

  return (
    <CreateStepLayout
      step={7}
      title={t('create.audience.title')}
      subtitle={t('create.audience.subtitle')}
      footer={
        <>
          <Button
            label={isPending ? t('create.audience.publishing') : t('common.publish')}
            disabled={isPending}
            onPress={() => publish(range)}
          />
          {refusal ? (
            <Text className="mt-[12px] text-center text-[14px] text-ink-dim">{refusal}</Text>
          ) : null}
          <TextButton
            label={t('create.audience.openToAll')}
            className="mt-[15px]"
            onPress={() => {
              setRange([AGE_MIN, AGE_MAX]);
              publish(null);
            }}
          />
        </>
      }
    >
      <AgeRangeControl
        className="mt-[20px]"
        range={range}
        onChange={setRange}
        presets="inside"
        allLabel={t('onboarding.ageRange.presetAll')}
        unitLabel={t('common.years')}
      />

      <Spacer min={14} />
    </CreateStepLayout>
  );
}
