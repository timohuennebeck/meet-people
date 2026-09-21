import { CaretDown, CaretUp } from 'phosphor-react-native';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Modal, Pressable, View } from 'react-native';

import { usePreferences, useUpdatePreferences } from '@shared/data/queries/use-preferences';
import { setLocale } from '@shared/i18n';
import { cn } from '@shared/lib/cn';
import { haptics } from '@shared/lib/haptics';
import { APP_LANGUAGES } from '@shared/lib/languages';
import { colors, shadows } from '@shared/theme/tokens';
import { SelectionDot } from '@shared/ui/card';
import { Flag } from '@shared/ui/flag';
import { Text } from '@shared/ui/text';

/** Height of the pill, so the menu can be hung the right distance below it. */
const PILL_HEIGHT = 44;
const GAP = 10;

/** Where the menu hangs: the pill's own corner, in window coordinates. */
interface Anchor {
  top: number;
  right: number;
}

/** `flag · name · caret` on a white pill — the closed state, and its copy in the menu. */
function Pill({
  flag,
  name,
  open,
  onPress,
  innerRef,
}: {
  flag: string;
  name: string;
  open: boolean;
  onPress?: () => void;
  innerRef?: React.Ref<View>;
}) {
  const { t } = useTranslation();
  const Caret = open ? CaretUp : CaretDown;

  return (
    <Pressable
      ref={innerRef}
      accessibilityRole="button"
      accessibilityLabel={t('welcome.languagePicker')}
      accessibilityState={{ expanded: open }}
      onPress={onPress}
      className="flex-row items-center gap-[8px] rounded-pill bg-surface py-[8px] pl-[8px] pr-[14px] active:opacity-90"
      style={shadows.floatCard}
    >
      <Flag code={flag} size={28} />
      <Text weight={500} className="text-[15.5px]">
        {name}
      </Text>
      <Caret size={13} weight="bold" color={colors.inkBody} />
    </Pressable>
  );
}

/**
 * The app's language, chosen before anything else happens.
 *
 * It used to be the first onboarding step — a full screen asking the question
 * before the person had any reason to care about the answer. As a pill on the
 * welcome screen it is there for whoever needs it and invisible to everyone
 * whose phone was already in the right language, which is most people.
 *
 * The menu is a `Modal` rather than an absolutely positioned panel because it
 * has to escape the welcome screen's `overflow-hidden` frame and cover the
 * content behind it. That means redrawing the pill inside the modal at the
 * coordinates the real one was measured at, so it appears to stay put while
 * the menu opens under it.
 */
export function LanguagePicker() {
  const { t } = useTranslation();
  const { data: preferences } = usePreferences();
  const { mutate: update } = useUpdatePreferences();

  const pill = useRef<View>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  const stored = preferences?.appLanguage ?? 'pt-BR';
  // Settings stores `pt-BR`; the picker's codes are the bare `pt`, `en`, …
  const current =
    APP_LANGUAGES.find((language) => stored.startsWith(language.code)) ?? APP_LANGUAGES[0]!;

  const open = () => {
    haptics.tap();
    pill.current?.measureInWindow((x, y, width) => {
      setAnchor({ top: y, right: Dimensions.get('window').width - (x + width) });
    });
  };

  const choose = (code: string) => {
    haptics.select();
    update({ appLanguage: code });
    // `LocaleSync` would pick this up from preferences anyway, one render later.
    // Setting it here makes the menu's own labels change as it closes.
    setLocale(code);
    setAnchor(null);
  };

  return (
    <>
      <Pill innerRef={pill} flag={current.flag} name={current.name} open={false} onPress={open} />

      <Modal
        visible={anchor !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setAnchor(null)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          className="flex-1"
          // The scrim is a plain overlay rather than a palette colour, as every
          // other translucent layer in the app is.
          style={{ backgroundColor: 'rgba(21,24,31,0.22)' }}
          onPress={() => setAnchor(null)}
        >
          {anchor ? (
            <>
              <View className="absolute" style={{ top: anchor.top, right: anchor.right }}>
                <Pill
                  flag={current.flag}
                  name={current.name}
                  open
                  onPress={() => setAnchor(null)}
                />
              </View>

              <View
                className="absolute min-w-[252px] rounded-card bg-surface p-[8px]"
                style={[
                  { top: anchor.top + PILL_HEIGHT + GAP, right: anchor.right },
                  shadows.floatCard,
                ]}
              >
                {APP_LANGUAGES.map((language) => {
                  const selected = language.code === current.code;

                  return (
                    <Pressable
                      key={language.code}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      onPress={() => choose(language.code)}
                      className={cn(
                        'flex-row items-center gap-[14px] rounded-well px-[12px] py-[10px] active:opacity-80',
                        selected && 'bg-brand-row',
                      )}
                    >
                      <Flag code={language.flag} size={34} />
                      <Text weight={selected ? 600 : 400} className="flex-1 text-[17px]">
                        {language.name}
                      </Text>
                      {selected ? <SelectionDot selected size={26} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}
        </Pressable>
      </Modal>
    </>
  );
}
