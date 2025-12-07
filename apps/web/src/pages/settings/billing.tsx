import type { NextPageWithLayout } from "~/pages/_app";
import { getDashboardLayout } from "~/components/Dashboard";
import { SettingsLayout } from "~/components/SettingsLayout";
import BillingSettings from "~/views/settings/BillingSettings";

const BillingSettingsPage: NextPageWithLayout = () => {
  return (
    <SettingsLayout currentTab="billing">
      <BillingSettings />
    </SettingsLayout>
  );
};

BillingSettingsPage.getLayout = (page) => getDashboardLayout(page);

// Force SSR to avoid router.query issues during build
export const getServerSideProps = () => {
  return { props: {} };
};

export default BillingSettingsPage;
