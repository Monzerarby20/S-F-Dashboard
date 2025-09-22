
export interface FirebaseUser {
    uid: string;
    email: string | null;
    displayName: string|null;
    role?: string;
    permissions?: string[];
    branchId?: number | null;
}
 


let currentUser: FirebaseUser | null = null;

export const signInWithEmailAndPassword = async (email: string, password: string) => {
    console.log("Fake signInWithEmailAndPassword called");
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (email === "monzer@gmial.com" && password === "123456") {
        return { user: {
            uid: "123",
            email,
            displayName: email.split('@')[0],
        }
        };
    } else {
        throw new Error("Invalid email or password");
    }
}

export const signOut = async () => {
    console.log("Fake signOut called");
    await new Promise(resolve => setTimeout(resolve, 500));
    currentUser = null;
    return true;
}


export const createUserWithEmailAndPassword = async (email: string, password: string) => {
    console.log("Fake createUserWithEmailAndPassword called");
    currentUser = {
        uid: "123",
        email,
        displayName: email.split('@')[0],
        role: 'admin',
        permissions: [],
        branchId: null}
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { user:currentUser};
}

export const onAuthStateChanged = (_auth : any,callback: (user: FirebaseUser| null) => void) => {
    console.log("Fake onAuthStateChanged called");
    // Simulate a user being logged in after 1 second
    const timeoutId = setTimeout(() => {
        callback(currentUser ? { uid: currentUser.uid, email: currentUser.email,displayName:currentUser.displayName } : null);
    }, 1000);

    // Return an unsubscribe function
    return () => 
        {
            console.log("Fake unsubscribe called");
            clearTimeout(timeoutId)};
}
