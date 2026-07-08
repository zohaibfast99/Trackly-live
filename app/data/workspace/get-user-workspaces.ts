import { db } from "@/lib/db";
import { userRequired } from "../user/is-user-authenticated";

export const getUserWorkspaces = async () => {
    try{
        const { user } = await userRequired();

        // Look up the user with their workspace memberships.
        // Brand-new users won't have a DB row yet — it is created during
        // onboarding (see createUser). Returning null here lets the layout
        // redirect them to /onboarding.
        const dbUser = await db.user.findUnique({
            where: {id: user.id},
            include: {
                workspaces: {
                    select: {
                        id: true,
                        userId: true,
                        workspaceId: true,
                        accessLevel: true,
                        createdAt: true,
                        workspace: {select: {name: true}},
                    },
                },
            },
        });

        return {data: dbUser}
    }catch (error) {
        // Check if it's a redirect error and re-throw it
        if (error && typeof error === 'object' && 'digest' in error) {
            const digest = (error as any).digest;
            if (typeof digest === 'string' && digest.includes('NEXT_REDIRECT')) {
                throw error;
            }
        }
        
        console.error("Error in getUserWorkspaces:", error)
        return{
            success:false,
            error:true,
            message: "Failed to fetch workspaces",
            status: 500,
        };
    }
};