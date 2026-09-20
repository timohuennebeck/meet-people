import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  AgeRangeControl,
  AGE_MAX,
  AGE_MIN,
  type AgeRange,
} from '@shared/components/AgeRangeControl';
import { Button, Spacer, TextButton } from '@shared/ui';

import { CreateStepLayout } from '../../ui/CreateStepLayout';

/** Create step 7 — an optional age range for the plan, then publish. */
export function CreateAudienceScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [range, setRange] = useState<AgeRange>([21, 34]);

  const publish = () => router.replace('/create/published');

  return (
    <CreateStepLayout
      step={7}
      title={t('create.audience.title')}
      subtitle={t('create.audience.subtitle')}
      footer={
        <>
          <Button label={t('common.publish')} onPress={publish} />
          <TextButton
            label={t('create.audience.openToAll')}
            className="mt-[15px]"
            onPress={() => {
              setRange([AGE_MIN, AGE_MAX]);
              publish();
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
