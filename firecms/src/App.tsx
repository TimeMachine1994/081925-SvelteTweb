import React, { useCallback, useMemo, useEffect } from "react";

import {
    AppBar,
    Authenticator,
    CircularProgressCenter,
    Drawer,
    FireCMS,
    ModeControllerProvider,
    NavigationRoutes,
    Scaffold,
    SideDialogs,
    SnackbarProvider,
    useBuildLocalConfigurationPersistence,
    useBuildModeController,
    useBuildNavigationController,
    useValidateAuthenticator
} from "@firecms/core";
import {
    FirebaseAuthController,
    FirebaseLoginView,
    FirebaseSignInProvider,
    FirebaseUserWrapper,
    useFirebaseAuthController,
    useFirebaseStorageSource,
    useFirestoreDelegate,
    useInitialiseFirebase,
} from "@firecms/firebase";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { CenteredView } from "@firecms/ui";
import { usersCollection } from "./collections/users";
import { memorialsCollection } from "./collections/memorials";
import { blogCollection } from "./collections/blog";

import { firebaseConfig } from "./firebase_config";

function App() {

    // Use your own authentication logic here
    const myAuthenticator: Authenticator<FirebaseUserWrapper> = useCallback(async ({
                                                                                       user,
                                                                                       authController
                                                                                   }) => {

        // Define admin emails - add your email here
        const adminEmails = [
            "@tributestream.com",  // Any TributeStream email
            "@firecms.co",         // FireCMS emails
            "austinbryanfilm@gmail.com"  // Austin's admin email
        ];

        const userEmail = user?.email?.toLowerCase() || "";
        const isAdmin = adminEmails.some(adminEmail => userEmail.includes(adminEmail));

        console.log("🔐 Authentication check:", {
            email: userEmail,
            isAdmin,
            user: user?.displayName || user?.email
        });

        if (!isAdmin) {
            console.warn("❌ Access denied - not an admin email:", userEmail);
            throw Error("Access denied. Admin access required for FireCMS.");
        }

        console.log("✅ Admin access granted to:", userEmail);
        return true;
    }, []);

    const collections = useMemo(() => {
        console.log("Loading collections into FireCMS:", ["usersCollection", "memorialsCollection", "blogCollection"]);
        return [usersCollection, memorialsCollection, blogCollection];
    }, []);

    const {
        firebaseApp,
        firebaseConfigLoading,
        configError
    } = useInitialiseFirebase({
        firebaseConfig
    });

    useEffect(() => {
        // Emulators disabled - connecting to production Firebase
        console.log('🔥 FireCMS connecting to production Firebase project:', firebaseConfig.projectId);
        
        /* EMULATORS DISABLED - Uncomment below if you want to use Firebase emulators
        if (import.meta.env.DEV && firebaseApp) {
            console.log("Connecting to Firebase emulators");
            try {
                const auth = getAuth(firebaseApp);
                connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });

                const db = getFirestore(firebaseApp);
                connectFirestoreEmulator(db, '127.0.0.1', 8080);

                const storage = getStorage(firebaseApp);
                connectStorageEmulator(storage, '127.0.0.1', 9199);
            } catch (error) {
                console.error('Error connecting to Firebase emulators:', error);
            }
        }
        */
    }, [firebaseApp]);

    // Controller used to manage the dark or light color mode
    const modeController = useBuildModeController();

    const signInOptions: FirebaseSignInProvider[] = ["google.com", "password"];

    // Controller for managing authentication
    const authController: FirebaseAuthController = useFirebaseAuthController({
        firebaseApp,
        signInOptions
    });

    // Controller for saving some user preferences locally.
    const userConfigPersistence = useBuildLocalConfigurationPersistence();

    // Delegate used for fetching and saving data in Firestore
    const firestoreDelegate = useFirestoreDelegate({
        firebaseApp
    });

    // Controller used for saving and fetching files in storage
    const storageSource = useFirebaseStorageSource({
        firebaseApp
    });

    const {
        authLoading,
        canAccessMainView,
        notAllowedError
    } = useValidateAuthenticator({
        authController,
        authenticator: myAuthenticator,
        dataSourceDelegate: firestoreDelegate,
        storageSource
    });

    const navigationController = useBuildNavigationController({
        disabled: authLoading,
        collections,
        authController,
        dataSourceDelegate: firestoreDelegate
    });

    if (firebaseConfigLoading || !firebaseApp) {
        return <>
            <CircularProgressCenter/>
        </>;
    }

    if (configError) {
        return <CenteredView>{configError}</CenteredView>;
    }

    return (
        <SnackbarProvider>
            <ModeControllerProvider value={modeController}>
                <FireCMS
                    navigationController={navigationController}
                    authController={authController}
                    userConfigPersistence={userConfigPersistence}
                    dataSourceDelegate={firestoreDelegate}
                    storageSource={storageSource}
                >
                    {({
                          context,
                          loading
                      }) => {

                        if (loading || authLoading) {
                            return <CircularProgressCenter size={"large"}/>;
                        }

                        if (!canAccessMainView) {
                            return <FirebaseLoginView authController={authController}
                                                      firebaseApp={firebaseApp}
                                                      signInOptions={signInOptions}
                                                      notAllowedError={notAllowedError}/>;
                        }

                        return <Scaffold
                            autoOpenDrawer={false}>
                            <AppBar title={"My demo app"}/>
                            <Drawer/>
                            <NavigationRoutes/>
                            <SideDialogs/>
                        </Scaffold>;
                    }}
                </FireCMS>
            </ModeControllerProvider>
        </SnackbarProvider>
    );

}

export default App;
