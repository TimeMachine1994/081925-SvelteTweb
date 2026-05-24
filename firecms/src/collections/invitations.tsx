import { buildCollection, buildProperty } from "@firecms/core";
import type { Invitation } from "../types/invitation";

console.log("Initializing Invitations Collection Schema");

export const invitationsCollection = buildCollection<Invitation>({
    id: "invitations",
    name: "Invitations",
    path: "invitations",
    properties: {
        email: buildProperty({
            dataType: "string",
            name: "Email",
            validation: { required: true, email: true }
        }),
        role: buildProperty({
            dataType: "string",
            name: "Role",
            enumValues: {
                family_member: "Family Member",
                viewer: "Viewer"
            },
            validation: { required: true }
        }),
        status: buildProperty({
            dataType: "string",
            name: "Status",
            enumValues: {
                pending: "Pending",
                accepted: "Accepted"
            },
            validation: { required: true }
        }),
        createdAt: buildProperty({
            dataType: "date",
            name: "Created At",
            autoValue: "on_create",
            readOnly: true
        }),
        acceptedAt: buildProperty({
            dataType: "date",
            name: "Accepted At",
            readOnly: true
        })
    }
});