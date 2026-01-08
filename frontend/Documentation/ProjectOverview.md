The way this document is organized is with Project Overview, User Personas, and then User Journeys. User Personas are denoted by angle brackets, like <MO> for Memorial Owner. Journeys are denoted by three #'s.  Each user type has different journeys that share some common steps, functions, and components. We need to optimize this as best we can.

# Project Overview
This is Tributestream.com, a livestreaming platform for memorials. We are using 
SvelteKit for the frontend, and Connecting to a Firestore Database via Firebase.
Firebase is also used for authentication and hosting files. Vercel is used for deployment of
the main website front end.

There are also several other services being used:
- Cloudflare for streaming
- Stripe for payments
- Twilio Send Grid for Emails

# User Personas
There are multiple user personas that should have different permissions to do different things.

## Super Admin <SA>
The super administrator <SA> has all rights. They should be able to create new links update existing 
memorials, see and edit users and their content, manage payments, and more. 
We need to look at the following user journeys and determine what permissions are needed for each persona, as well was what things an admin would need to do to manage each persona.


## Unregistered Guest <UG>

## Memorial Owner <MO>
So at it's heart, it's a digital management platform for the obituary page which looks really nice. Memoiral Owners should be able to create memorial pages, edit the content, and book services by paying.

The different Journeys for Memoiral Owners <MO> are as follows:
 

### <MO> Initial Setup - Through Home Page
1. The <UG> arrives on the homepage and has the option to enter a loved ones name. Two buttons, search and create memorial. Clicking create memorial will take them to the create new memorial form where they can enter more of their details.
2. After submitting that form, they get sent to the memorial page. 
*LOGIC* -  The system should check if the memorial already exists, and if it does, append the  next iterative number to the unique URL. <2.1> The system should also check if the user exists and if so, give them a prompt to login, keeping the memorial data saved. 

<2.1> If the user exists, they should be prompted to login, keeping the memorial data saved. The user will be then sent to the new memorial page they were trying to create once they login.

3. Whent the user gets to the memorial page, if this is thier first visit while logged in, after 5 seconds a litttle red banner appears at the top askign the to finish booking.

4. Finishing booking button takes them to the calculator page with data prefilled.
*LOGIC* - The calculator page should have the data prefilled from the memorial page. Once they make adjustmetns they can click <4.1> save and pay now or click <4.2> save and pay later. 

This concludes this journey.
### <MO> Initial Setup - Through Funeral Director Admin Page
### <MO> Initial Setup - Through Create New Account Page

## Family Member
Family Members are not Memorial Owners, but they may be able to view the memorial page and contribute to it.
### <FM> Initial Setup - Through Home Page (Mistakenly thinking they are the MO)
### <FM> Initial Setup - Through Create New Account Page
### <FM> Initial Setup - Through Memorial Owner Admin Page

## Funeral Director 
Funeral Directors have the ability to create and manage memorials for their clients. Should a client need help with creating a memorial, completing payment, or editing images and memoiral content, they should be able to assist them.

### <FD> Initial Setup - Through Create New Funeral Director Account Page
1. The <GU> can access this page by clicking on the "Create New Funeral Director Account" button on the Funeral director's info page. Once they input the form data it registers an account, logs them in, and redirects them to the Funeral Director Dashboard.

This concludes this journey.

### <FD> Livestream A Memorial
Each memorial can have a livestream set up for it. The goal here is for the funeral director be able to livestream using their account via the browser on a phone. The phone 

Notes: How livestreaming works. The company creates a RTMP link to stream to, and saves it to a phone. This way the funeral director can steam just by opening the app, super easy. We want the <FD> to be able to manage their encoder settings from the dashboard, via a button. The idea is they can "assign" an encoder number, which the <SA> had previoulsy setup with a real life device. Then in the memorial manager where they have options per memorial, they can manually schedule a start time, as well as asign the device they plan on streaming to. this way the <FD> can set a time, and the user will a countdown timer. HOwever if they go live with the device, our website will stream to the all the pages it's assigned to. 
*IMPLEMENTATION*
- **Route:** `/funeral-director/dashboard`
- **File:** `src/routes/funeral-director/dashboard/+page.svelte`
- **Server:** `src/routes/funeral-director/dashboard/+page.server.ts`
- *STATUS:* ⚠️ **PARTIAL** - Dashboard exists but does not yet have "manage streams" link per memorial. Currently profile-focused.
### <FD> Dashboard - Create New Memorial
1. The <FD> can create a new memorial by clicking on the "Create New Memorial" button on the Funeral Director Dashboard. This will take them to the memorial creation page where they can input the memorial details.
2. *LOGIC* Once submmitted, the <FD> should be redirected to the memorial page they just created. It follows a similar path for the <MO> journey "<MO> Initial Setup - Through Home Page". The difference is we are logged in as the funeral director and can go back to the dashboard to edit any memorial as if they were logged in as that user.

## Viewer
Viewers are people who come to the memorial page to pay their respects. They should be able to view the memorial page, leave messages on the memorial page and contribute to the memorial page if the family owner enables either feature.

### <V> Initial Setup - Through Home Page
### <V> Initial Setup - Through Memorial Page