import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { StateView } from '@/components/StateView';

export default function NotFound() {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <Screen>
      <StateView
        icon="travel-explore"
        title={t('states.notFoundTitle')}
        body={t('states.notFoundBody')}
        actions={<Button label={t('states.goHome')} icon="home" onPress={() => router.replace('/home')} />}
      />
    </Screen>
  );
}
