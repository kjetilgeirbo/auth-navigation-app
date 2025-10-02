import type { CreateAuthChallengeTriggerHandler } from 'aws-lambda';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// Initialize SES client
const sesClient = new SESClient({ region: process.env.AWS_REGION || 'eu-north-1' });

export const handler: CreateAuthChallengeTriggerHandler = async (event) => {
  if (event.request.challengeName === 'CUSTOM_CHALLENGE') {
    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const email = event.request.userAttributes.email;
    console.log(`Generated code ${code} for user ${email}`);

    // Send the code via email using Amazon SES
    try {
      const emailParams = {
        Source: process.env.SES_FROM_EMAIL || 'noreply@fagfilm.no', // Use environment variable or default
        Destination: {
          ToAddresses: [email],
        },
        Message: {
          Subject: {
            Data: 'Din innloggingskode',
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>Velkommen til Fagfilm auth fix</h2>
                  <p>Din innloggingskode er:</p>
                  <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                    <h1 style="font-size: 36px; letter-spacing: 8px; margin: 0;">${code}</h1>
                  </div>
                  <p>Denne koden er gyldig i 15 minutter.</p>
                  <p>Hvis du ikke har bedt om denne koden, kan du ignorere denne e-posten.</p>
                  <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                  <p style="font-size: 12px; color: #666;">Dette er en automatisk generert e-post. Vennligst ikke svar på denne meldingen.</p>
                </div>
              `,
              Charset: 'UTF-8',
            },
            Text: {
              Data: `Din innloggingskode er: ${code}\n\nDenne koden er gyldig i 15 minutter.\n\nHvis du ikke har bedt om denne koden, kan du ignorere denne e-posten.`,
              Charset: 'UTF-8',
            },
          },
        },
      };

      const command = new SendEmailCommand(emailParams);
      await sesClient.send(command);
      console.log(`Email sent successfully to ${email}`);
    } catch (error) {
      console.error('Error sending email:', error);
      // Even if email fails, we still set the code for the challenge
      // In production, you might want to handle this differently
    }

    // Set the challenge parameters
    event.response.publicChallengeParameters = {};
    event.response.privateChallengeParameters = { code };
    event.response.challengeMetadata = `CODE-${code}`;
  }

  return event;
};