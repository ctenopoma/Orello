import type { NextPageWithLayout } from "~/pages/_app";
import { getDashboardLayout } from "~/components/Dashboard";
import { SettingsLayout } from "~/components/SettingsLayout";
import ApiSettings from "~/views/settings/ApiSettings";

const ApiSettingsPage: NextPageWithLayout = () => {
  return (
    <SettingsLayout currentTab="api">
      <ApiSettings />
    </SettingsLayout>
  );
};

ApiSettingsPage.getLayout = (page) => getDashboardLayout(page);

// Force SSR to avoid router.query issues during build
export const getServerSideProps = () => {
  return { props: {} };
};

export default ApiSettingsPage;
