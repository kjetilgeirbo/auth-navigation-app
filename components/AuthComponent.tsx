"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

export default function AuthComponent() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div className="auth-container">
          <p>Welcome {user?.username}!</p>
          <button onClick={signOut}>Sign out</button>
        </div>
      )}
    </Authenticator>
  );
}