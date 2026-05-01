import { NextPage } from 'next';
import { redirect } from 'next/navigation';

const Page: NextPage = () => {
  redirect('/auth/login')
  // return <div>lorem</div>;
};

export default Page;
