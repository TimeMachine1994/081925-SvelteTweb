import { buildCollection, buildProperty } from "@firecms/core";
import type { Booking } from "../types/booking";

console.log("Initializing Bookings Collection Schema");

export const bookingsCollection = buildCollection<Booking>({
    id: "bookings",
    name: "Bookings",
    path: "bookings",
    description: "Service bookings made by users",
    properties: {
        userId: buildProperty({
            dataType: "string",
            name: "User ID",
            readOnly: true,
            description: "The ID of the user who made the booking"
        }),
        memorialId: buildProperty({
            dataType: "string",
            name: "Memorial ID",
            readOnly: true,
            description: "The ID of the memorial this booking is for"
        }),
        package: buildProperty({
            dataType: "string",
            name: "Package",
            description: "The selected service package"
        }),
        serviceDetails: buildProperty({
            dataType: "map",
            name: "Service Details",
            description: "Details about the memorial service"
        }),
        additionalServices: buildProperty({
            dataType: "map",
            name: "Additional Services",
            description: "Any additional services selected"
        }),
        status: buildProperty({
            dataType: "string",
            name: "Status",
            description: "The status of the booking",
            enumValues: {
                pending: "Pending",
                confirmed: "Confirmed",
                cancelled: "Cancelled"
            }
        }),
        createdAt: buildProperty({
            dataType: "date",
            name: "Created At",
            autoValue: "on_create",
            readOnly: true
        }),
        updatedAt: buildProperty({
            dataType: "date",
            name: "Updated At",
            autoValue: "on_update",
            readOnly: true
        })
    }
});