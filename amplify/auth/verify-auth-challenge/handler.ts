import type { VerifyAuthChallengeResponseTriggerHandler } from 'aws-lambda';

export const handler: VerifyAuthChallengeResponseTriggerHandler = async (event) => {
  const expectedCode = event.request.privateChallengeParameters?.code;
  const providedCode = event.request.challengeAnswer;

  console.log('VerifyAuthChallenge triggered', {
    expectedCode,
    providedCode,
    username: event.userName,
    privateChallengeParameters: event.request.privateChallengeParameters,
    challengeAnswer: event.request.challengeAnswer
  });

  if (expectedCode === providedCode) {
    console.log('Code verified successfully');
    event.response.answerCorrect = true;
  } else {
    console.log('Code verification failed', {
      expected: expectedCode,
      provided: providedCode,
      match: expectedCode === providedCode
    });
    event.response.answerCorrect = false;
  }

  return event;
};