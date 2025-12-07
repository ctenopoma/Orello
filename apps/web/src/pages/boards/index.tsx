import type { NextPageWithLayout } from "../_app";
import { getDashboardLayout } from "~/components/Dashboard";
import Popup from "~/components/Popup";
import BoardsView from "~/views/boards";

const BoardsPage: NextPageWithLayout = () => {
  return (
    <>
      <BoardsView />
      <Popup />
    </>
  );
};

BoardsPage.getLayout = (page) => getDashboardLayout(page);

// Force SSR to avoid router.query issues during build
export const getServerSideProps = () => {
  return { props: {} };
};

export default BoardsPage;
