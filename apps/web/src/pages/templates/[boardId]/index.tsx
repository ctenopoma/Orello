import type { NextPageWithLayout } from "~/pages/_app";
import { getDashboardLayout } from "~/components/Dashboard";
import Popup from "~/components/Popup";
import BoardView from "~/views/board";

const TemplatePage: NextPageWithLayout = () => {
  return (
    <>
      <BoardView isTemplate />
      <Popup />
    </>
  );
};

TemplatePage.getLayout = (page) => getDashboardLayout(page);

// Force SSR to avoid router.query issues during build
export const getServerSideProps = () => {
  return { props: {} };
};

export default TemplatePage;
