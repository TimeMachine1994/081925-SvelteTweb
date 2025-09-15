# Goal for Funeral Director Functionality

The primary goal is to create a streamlined workflow for logged-in funeral directors to register new memorials on behalf of families.

## Key Workflow Steps:

1.  **Prerequisite:** A user must be logged in and have the `funeral_director` role.
2.  **Access Form:** The funeral director navigates to the `/register/funeral-director` page.
3.  **Auto-fill Director Info:** The form should automatically populate the funeral director's information (name, email, funeral home name) and make these fields read-only. The system should not allow the director to select a different funeral home from a dropdown.
4.  **Family & Memorial Details:** The director fills in the details for the family and the memorial:
    *   Loved one's name.
    *   Family contact name.
    *   Family contact email (this will be used to create the family member's account).
    *   Memorial service details (date, time, location).
5.  **Submission:** The director submits the form.
6.  **Backend Processing:**
    *   A new user account is created for the family member.
    *   A new memorial document is created in Firestore.
    *   The logged-in funeral director is automatically assigned as the manager/organizer for this new memorial, granting them administrative privileges.
7.  **Confirmation & Link Sharing:** After successful submission, the funeral director is shown a confirmation message that includes the unique, shareable link to the newly created memorial page.
8.  **Post-Creation Management:** The funeral director can later access a dashboard or portal where they can manage all the memorials they have created, including making edits and managing settings.

This workflow ensures that the funeral director who initiates the registration is always the one who manages the memorial, creating a clear and direct link between the director and the families they serve.
