# Frontend Configuration

## Environment Variables

This project uses environment variables to manage Firebase configuration for different environments.

### Local Development

1.  Create a `.env` file in this directory (`frontend/.env`).
2.  Copy the contents of `.env.example` into your new `.env` file.
3.  Replace the placeholder values with your Firebase project's configuration. For local development, you can use the same Firebase project you use for production, as the application will automatically connect to the Firebase emulators.

### Production

For production deployments, you will need to set the environment variables in your hosting provider's configuration. The required variables are listed in the `.env.example` file.

**Note:** The `PRIVATE_FIREBASE_SERVICE_ACCOUNT_KEY` should be the JSON content of your service account key, not a path to the file.
