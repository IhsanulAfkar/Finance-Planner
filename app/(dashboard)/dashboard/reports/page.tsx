import { Metadata, NextPage } from 'next'
import PageClient from './page.client'
export const metadata: Metadata = {
  title: "Report "
}
const Page: NextPage = () => {
  return <PageClient />
}

export default Page