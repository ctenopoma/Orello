import type { NextPageWithLayout } from "~/pages/_app";
import { getDashboardLayout } from "~/components/Dashboard";
import Popup from "~/components/Popup";
import BoardView from "~/views/board";

const BoardPage: NextPageWithLayout = () => {
  return (
    <>
      <BoardView />
      <Popup />
    </>
  );
};

BoardPage.getLayout = (page) => getDashboardLayout(page);

// Force SSR to avoid router.query issues during build
export const getServerSideProps = () => {
  return { props: {} };
};

export default BoardPage;
