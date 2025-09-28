import type { DefineAuthChallengeTriggerHandler } from 'aws-lambda';

export const handler: DefineAuthChallengeTriggerHandler = async (event) => {
  console.log('DefineAuthChallenge triggered', {
    session: event.request.session,
    userNotFound: event.request.userNotFound,
    challengeName: event.request.session?.slice(-1)[0]?.challengeName,
    challengeResult: event.request.session?.slice(-1)[0]?.challengeResult
  });

  // If user doesn't exist, we should NOT fail auth for passwordless
  // The user will be created during the sign-up flow
  if (event.request.userNotFound) {
    console.log('User not found - will be created via sign-up flow');
    // Don't fail authentication, let the sign-up flow handle it
    event.response.issueTokens = false;
    event.response.failAuthentication = false;
    return event;
  }

  // Check if this is the initial request
  if (!event.request.session || event.request.session.length === 0) {
    // Start custom challenge for passwordless auth
    event.response.issueTokens = false;
    event.response.failAuthentication = false;
    event.response.challengeName = 'CUSTOM_CHALLENGE';
    return event;
  }

  const lastChallenge = event.request.session.slice(-1)[0];

  // Check if user has failed too many times (3 attempts)
  const failures = event.request.session.filter(
    (challenge) => challenge.challengeName === 'CUSTOM_CHALLENGE' && challenge.challengeResult === false
  );

  if (failures.length >= 3) {
    // Too many failed attempts
    event.response.issueTokens = false;
    event.response.failAuthentication = true;
    return event;
  }

  // Check if the last challenge was answered correctly
  if (lastChallenge.challengeName === 'CUSTOM_CHALLENGE' && lastChallenge.challengeResult === true) {
    // Challenge answered correctly, issue tokens
    event.response.issueTokens = true;
    event.response.failAuthentication = false;
    return event;
  }

  // Check if the last challenge was answered incorrectly
  if (lastChallenge.challengeName === 'CUSTOM_CHALLENGE' && lastChallenge.challengeResult === false) {
    // Wrong answer, issue another challenge
    event.response.issueTokens = false;
    event.response.failAuthentication = false;
    event.response.challengeName = 'CUSTOM_CHALLENGE';
    return event;
  }

  // For SRP_A or PASSWORD_VERIFIER challenges, skip to custom challenge
  if (lastChallenge.challengeName === 'SRP_A' || lastChallenge.challengeName === 'PASSWORD_VERIFIER') {
    event.response.issueTokens = false;
    event.response.failAuthentication = false;
    event.response.challengeName = 'CUSTOM_CHALLENGE';
    return event;
  }

  // Default: issue a new challenge
  event.response.issueTokens = false;
  event.response.failAuthentication = false;
  event.response.challengeName = 'CUSTOM_CHALLENGE';

  return event;
};