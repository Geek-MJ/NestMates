import { useTranslation } from 'react-i18next';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import useMediaQuery from '../../hooks/useMediaQuery.js';
import ImmersiveJourney from '../../landing/ImmersiveJourney.jsx';
import LandingFooter from '../../landing/components/LandingFooter.jsx';
import LandingHeader from '../../landing/components/LandingHeader.jsx';
import StackedJourney from '../../landing/StackedJourney.jsx';
import WorldDefs from '../../landing/world/WorldDefs.jsx';
import { IMMERSIVE_QUERY } from '../../utils/media.js';

/**
 * Public landing page: a walk through an illustrated shared home. Wide screens get the
 * scroll-driven camera journey; smaller screens and reduced motion get the stacked story.
 */
export default function LandingPage() {
  const { t } = useTranslation();
  const immersive = useMediaQuery(IMMERSIVE_QUERY);
  useDocumentTitle(t('landing.title'));

  return (
    <>
      <a href="#main" className="skip-link">
        {t('a11y.skipToContent')}
      </a>
      <WorldDefs />
      <LandingHeader />
      <main id="main" tabIndex={-1}>
        {immersive ? <ImmersiveJourney /> : <StackedJourney />}
      </main>
      <LandingFooter />
    </>
  );
}
