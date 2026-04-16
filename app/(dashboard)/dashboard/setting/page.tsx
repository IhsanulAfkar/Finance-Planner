import { NextPage } from 'next'
import PageClient from './page.client'

interface Props { }

const Page: NextPage<Props> = ({ }) => {
  return <PageClient />
}

export default Page