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

        // Set admin privileges IMMEDIATELY and make them immutable
        const adminExtra = { admin: true };
        
        // Use Object.defineProperty to make it non-configurable and persistent
        Object.defineProperty(authController, 'extra', {
            value: adminExtra,
            writable: false,
            configurable: false,
            enumerable: true
        });
        
        // Also set it as a direct property for backup
        Object.defineProperty(authController, 'isAdmin', {
            value: true,
            writable: false,
            configurable: false,
            enumerable: true
        });

        console.log("✅ Full admin access granted to:", userEmail, "with immutable privileges:", authController.extra);
        
        // Double-check that admin flag is set
        setTimeout(() => {
            console.log("🔍 Admin flag check after authenticator:", {
                extraExists: !!authController.extra,
                adminFlag: authController.extra?.admin,
                isAdminDirect: (authController as any).isAdmin,
                fullExtra: authController.extra
            });
        }, 100);
        
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
        disabled: false, // Force enable to see if authLoading is the issue
        collections,
        authController,
        dataSourceDelegate: firestoreDelegate
    });

    // Additional debugging for navigation controller issues
    useEffect(() => {
        console.log("🔍 Navigation Controller Debug:", {
            navigationController: !!navigationController,
            collectionsLength: collections.length,
            collectionsNames: collections.map(c => c.name),
            authControllerUser: !!authController.user,
            authControllerExtra: authController.extra,
            firestoreDelegate: !!firestoreDelegate,
            timestamp: new Date().toISOString()
        });
        
        if (!navigationController) {
            console.error("❌ Navigation Controller is null/undefined - this will prevent UI from loading");
        } else {
            console.log("✅ Navigation Controller exists:", {
                collections: navigationController.collections?.length || 0,
                navigationControllerType: typeof navigationController
            });
        }
        
        // Try to catch any collection schema errors
        collections.forEach((collection, index) => {
            try {
                console.log(`✅ Collection ${index + 1} (${collection.name}) schema is valid`);
            } catch (error) {
                console.error(`❌ Collection ${index + 1} (${collection.name}) has schema errors:`, error);
            }
        });
    }, [navigationController, collections, authController, firestoreDelegate]);

    // Debug navigation controller after it's built
    useEffect(() => {
        if (navigationController) {
            console.log("🗂️ Navigation Controller Built:", {
                exists: !!navigationController,
                disabled: authLoading,
                navigationController: navigationController
            });
        }
    }, [navigationController, authLoading]);

    // Debug authentication and navigation state
    useEffect(() => {
        console.log("🔐 Auth Debug:", {
            authLoading,
            canAccessMainView,
            userEmail: authController.user?.email,
            isAdmin: authController.extra?.admin,
            collectionsCount: collections.length,
            navigationController: !!navigationController,
            authControllerUser: !!authController.user
        });
    }, [authLoading, canAccessMainView, authController.user, authController.extra, collections.length, navigationController]);

    // Debug what's being rendered
    useEffect(() => {
        console.log("🎨 Render Debug:", {
            firebaseConfigLoading,
            firebaseApp: !!firebaseApp,
            configError,
            authLoading,
            canAccessMainView,
            notAllowedError
        });
    }, [firebaseConfigLoading, firebaseApp, configError, authLoading, canAccessMainView, notAllowedError]);

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
                            console.log("🔄 Showing loading screen - loading:", loading, "authLoading:", authLoading);
                            return <CircularProgressCenter size={"large"}/>;
                        }

                        if (!canAccessMainView) {
                            console.log("🚫 Showing login screen - canAccessMainView:", canAccessMainView, "notAllowedError:", notAllowedError);
                            return <FirebaseLoginView authController={authController}
                                                      firebaseApp={firebaseApp}
                                                      signInOptions={signInOptions}
                                                      notAllowedError={notAllowedError}/>;
                        }

                        console.log("✅ Showing main interface - collections count:", collections.length);
                        console.log("🧭 Navigation Controller:", {
                            exists: !!navigationController,
                            collections: navigationController?.collections?.length || 0,
                            navigationControllerObject: navigationController
                        });

                        // Debug what's being passed to the Scaffold
                        console.log("🏗️ Scaffold Render Debug:", {
                            navigationController: !!navigationController,
                            authController: !!authController,
                            userConfigPersistence: !!userConfigPersistence,
                            dataSourceDelegate: !!firestoreDelegate,
                            storageSource: !!storageSource,
                            timestamp: new Date().toISOString()
                        });

                        return <Scaffold
                            autoOpenDrawer={true}>
                            <AppBar title={"TributeStream Admin"}/>
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
