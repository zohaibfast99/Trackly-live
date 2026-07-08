import { userRequired } from '@/app/data/user/is-user-authenticated';
import { getUserWorkspaces } from '@/app/data/workspace/get-user-workspaces'
import { OnboardingForm } from '@/components/onboarding-form';
import { redirect } from 'next/navigation';
import React from 'react'

const page = async () => {
  const {data} = await getUserWorkspaces();
  const {user} = await userRequired();
  if (data?.onboardingCompleted && data?.workspaces.length > 0){
    redirect ("/workspace")
  } else if(data?.onboardingCompleted){
    redirect("/create-workspace")
  }

  const name = `${user?.given_name ||""} ${user?.family_name ||""}`
  return (
    <div className=''>
      <OnboardingForm 
        name={name} 
        email={user?.email as string} 
        image={user?.picture || ""}
      />
    </div>
  )
}

export default page
