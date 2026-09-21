import { useRouter } from 'expo-router';
import { HandWaving, Info, Key } from 'phosphor-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { JoinMode } from '@shared/data/schemas';
import { cn } from '@shared/lib/cn';
import { colors } from '@shared/theme/tokens';
import { Button, InfoNote, SelectableCard, SelectionDot, Text } from '@shared/ui';

import { useCreatePlan } from '../../data/create-plan-provider';
import { CreateStepLayout } from '../../ui/create-step-layout';

/** One of the two join modes, as a full-width option row. */
function ModeOption({
  icon,
  title,
  body,
  selected,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <SelectableCard
      selected={selected}
      onPress={onPress}
      padding={{ vertical: 20, horizontal: 18 }}
      className="flex-row items-center gap-[14px] rounded-tile"
    >
      <View
        className={cn(
          'h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full',
          selected ? 'bg-brand-wash' : 'bg-surface-chip',
        )}
      >
        {icon}
      </View>
      <View className="min-w-0 flex-1 gap-[4px]">
        <Text weight={600} className="text-[18px]">
          {title}
        </Text>
        <Text className="text-[14.5px] leading-[19.6px] text-ink-dim">{body}</Text>
      </View>
      <SelectionDot selected={selected} size={26} />
    </SelectableCard>
  );
}

/** Create step 4 — open to all, or the host approves each person. */
export function CreateJoinModeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { draft, set } = useCreatePlan();
  const mode = draft.joinMode;
  const setMode = (joinMode: JoinMode) => set({ joinMode });

  return (
    <CreateStepLayout
      step={4}
      title={t('create.joinMode.title')}
      subtitle={t('create.joinMode.subtitle')}
      footer={
        <Button label={t('common.continue')} onPress={() => router.push('/create/language')} />
      }
    >
      <View className="mt-[22px] flex-1 gap-[12px]">
        <ModeOption
          selected={mode === 'open'}
          onPress={() => setMode('open')}
          icon={<HandWaving size={23} color={mode === 'open' ? colors.brand : colors.inkDim} />}
          title={t('create.joinMode.openTitle')}
          body={t('create.joinMode.openBody')}
        />
        <ModeOption
          selected={mode === 'approval'}
          onPress={() => setMode('approval')}
          icon={<Key size={23} color={mode === 'approval' ? colors.brand : colors.inkDim} />}
          title={t('create.joinMode.approvalTitle')}
          body={t('create.joinMode.approvalBody')}
        />

        <View className="mt-[6px]">
          {/* No bubble behind it, so the glyph carries the brand colour itself
              and grows from 20 to 26 to hold the row against the two-line hint. */}
          <InfoNote icon={<Info size={26} weight="fill" color={colors.brand} />}>
            {t('create.joinMode.hint')}
          </InfoNote>
        </View>
      </View>
    </CreateStepLayout>
  );
}
