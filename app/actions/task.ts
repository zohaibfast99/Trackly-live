"use server"

import { TaskFormValues } from "@/components/task/create-task-dialog"
import { userRequired } from "../data/user/is-user-authenticated";
import { taskFormSchema } from "@/lib/schema";
import { db } from "@/lib/db";
import { TaskStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Authorization guard for task operations.
 * Verifies that:
 *   1. the project exists and actually belongs to `workspaceId`,
 *   2. the caller is a member of that workspace,
 *   3. the caller has explicit access to that project.
 * Returns the caller's workspace membership record.
 * Throws on any failure. Never trust client-supplied ids for auth without this.
 */
const requireProjectAccess = async (
    userId: string,
    workspaceId: string,
    projectId: string
) => {
    const project = await db.project.findUnique({
        where: { id: projectId },
        select: { id: true, workspaceId: true },
    });
    if (!project || project.workspaceId !== workspaceId) {
        throw new Error("Project not found in this workspace.");
    }

    const member = await db.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!member) {
        throw new Error("You are not a member of this workspace.");
    }

    const access = await db.projectAccess.findUnique({
        where: {
            workspaceMemberId_projectId: {
                workspaceMemberId: member.id,
                projectId,
            },
        },
    });
    if (!access) {
        throw new Error("You do not have access to this project.");
    }

    return member;
};

export const createNewTask=async(data: TaskFormValues,
    projectId:string,
    workspaceId:string
)=>{
    const {user}=await userRequired();
    const validatedData=taskFormSchema.parse(data);
    // Verify the project belongs to this workspace and the caller has access to it.
    await requireProjectAccess(user.id, workspaceId, projectId);
    const tasks=await db.task.findMany({
        where:{projectId},
    });


    const lastTask=tasks?.filter(task=>task.status === data.status).sort((a,b)=>b.position - a.position)[0];

    const position= lastTask? lastTask.position +1000:1000;
    const task=await db.task.create({
        data:{
            title:validatedData.title,
            
            description:validatedData.description as string,
            startDate:new Date(validatedData.startDate),
            dueDate:new Date(validatedData.dueDate),
        
            projectId,
            assigneeId: validatedData.assigneeId,
            status:validatedData.status,
            priority:validatedData.priority,
            position
        },
        include:{
            project:true,
        },

    });

    if (validatedData.attachments && validatedData?.attachments.length> 0)
    {
        await db.file.createMany({
            data:validatedData.attachments.map((file) => ({
                ...file,
                taskId:task.id,
            })),

            
        });
    }
    await db.activity.create({
        data:{
            type:"TASK_Created",
            description:`created task "${validatedData.title}"`,
            projectId,
            userId:user.id,
        }
    })
    return {success:true};
};

export const updatedTaskPosition=async(taskId:string, newPosition:number, status:TaskStatus, workspaceId?:string, projectId?:string)=>{
    const {user}=await userRequired();

    // Resolve the task's real project/workspace and authorize against those,
    // never against the (spoofable) workspaceId/projectId passed by the client.
    const existingTask=await db.task.findUnique({
        where:{id:taskId},
        select:{
            id:true,
            projectId:true,
            project:{select:{workspaceId:true}},
        },
    });
    if(!existingTask){
        throw new Error("Task not found.");
    }

    await requireProjectAccess(user.id, existingTask.project.workspaceId, existingTask.projectId);

    const task=await db.task.update({
        where:{id:taskId},
        data:{
            position:newPosition,
            status
        },
        include:{
            project:true
        }
    });

    // 🔥 Revalidate the project page to ensure fresh data across all views
    revalidatePath(`/workspace/${existingTask.project.workspaceId}/projects/${existingTask.projectId}`);

    return task;
}

export const updateTask=async(
    taskId:string,
    data: TaskFormValues,
    projectId:string,
    workspaceId:string
)=>{
    const {user}=await userRequired();
    const validatedData=taskFormSchema.parse(data);

    // Verify the project belongs to this workspace and the caller has access to it.
    await requireProjectAccess(user.id, workspaceId, projectId);

    // Ensure the task actually belongs to the given project (prevents cross-project tampering).
    const existingTask=await db.task.findUnique({
        where:{id:taskId},
        select:{projectId:true},
    });
    if(!existingTask || existingTask.projectId !== projectId){
        throw new Error("Task does not belong to this project.");
    }

    const task=await db.task.update({
        where:{id:taskId},
        data:{
            title:validatedData.title,
            description:validatedData.description as string,
            startDate:new Date(validatedData.startDate),
            dueDate:new Date(validatedData.dueDate), 
            assigneeId: validatedData.assigneeId,
            status:validatedData.status,
            priority:validatedData.priority,
        },
    });

    await db.activity.create({
        data:{
            type:"TASK_Created",
            description:`updated task "${validatedData.title}"`,
            projectId,
            userId:user.id,
        }
    })
    return {success:true};
};
