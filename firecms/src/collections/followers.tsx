import { buildCollection, buildProperty } from "@firecms/core";
import type { Follower } from "../types/follower";

console.log("Initializing Followers Collection Schema");

export const followersCollection = buildCollection<Follower>({
    id: "followers",
    name: "Followers",
    path: "followers",
    properties: {
        userId: buildProperty({
            dataType: "string",
            name: "User ID",
            validation: { required: true }
        }),
        email: buildProperty({
            dataType: "string",
            name: "Email",
            validation: { required: true, email: true }
        }),
        createdAt: buildProperty({
            dataType: "date",
            name: "Created At",
            autoValue: "on_create",
            readOnly: true
        })
    }
});