import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { StepScaffold } from '@shared/components/StepScaffold';
import { STEPS } from '@shared/lib/steps';
import { Button, Spacer, WheelPicker } from '@shared/ui';

/** The three wheels, centred on the selected 14 Mar 2002. */
const COLUMNS = [
  ['12', '13', '14', '15', '16'],
  ['Jan', 'Fev', 'Mar', 'Abr', 'Mai'],
  ['2000', '2001', '2002', '2003', '2004'],
] as const;

/** Step 12 — birthday, from which the displayed age is derived. */
export function BirthdayScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <StepScaffold
      position={STEPS.birthday}
      title={t('onboarding.birthday.title')}
      subtitle={t('onboarding.birthday.subtitle')}
      footer={
        <Button
          label={t('common.continue')}
          onPress={() => router.push('/(onboarding)/pronouns')}
        />
      }
    >
      <WheelPicker
        className="mt-[20px]"
        columns={COLUMNS}
        height={236}
        bandHeight={50}
        bandRadius={14}
        columnGap={34}
        rowGap={14}
        fontSize={23}
        selectedFontSize={26}
        fade={60}
      />

      <Spacer />
    </StepScaffold>
  );
}
