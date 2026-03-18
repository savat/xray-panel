import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default function Root() {
  const s = cookies().get('3x-ui')
  redirect(s ? '/dashboard' : '/login')
}
