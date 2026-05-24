import { buildCollection, buildProperty } from "@firecms/core";
import type { Embed } from "../types/embed";

console.log("Initializing Embeds Collection Schema");

export const embedsCollection = buildCollection<Embed>({
    id: "embeds",
    name: "Embeds",
    path: "embeds",
    properties: {
        type: buildProperty({
            dataType: "string",
            name: "Type",
            enumValues: {
                video: "Video",
                slideshow: "Slideshow"
            },
            validation: { required: true }
        }),
        url: buildProperty({
            dataType: "string",
            name: "URL",
            validation: { required: true }
        }),
        createdAt: buildProperty({
            dataType: "date",
            name: "Created At",
            autoValue: "on_create",
            readOnly: true
        })
    }
});