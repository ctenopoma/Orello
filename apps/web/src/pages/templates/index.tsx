import type { NextPageWithLayout } from "~/pages/_app";
import { getDashboardLayout } from "~/components/Dashboard";
import Popup from "~/components/Popup";
import BoardsView from "~/views/boards";

const TemplatesPage: NextPageWithLayout = () => {
  return (
    <>
      <BoardsView isTemplate />
      <Popup />
    </>
  );
};

TemplatesPage.getLayout = (page) => getDashboardLayout(page);

// Force SSR to avoid router.query issues during build
export const getServerSideProps = () => {
  return { props: {} };
};

export default TemplatesPage;
