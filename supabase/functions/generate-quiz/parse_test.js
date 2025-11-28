// Test harness for parseQuizQuestions (converted to plain JS)

function parseQuizQuestionsTest(content) {
  let cleanContent = content.trim();

  if (cleanContent.startsWith('```json')) {
    cleanContent = cleanContent.slice(7);
  }
  if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent.slice(3);
  }
  if (cleanContent.endsWith('```')) {
    cleanContent = cleanContent.slice(0, -3);
  }

  cleanContent = cleanContent.trim();

  try {
    const questions = JSON.parse(cleanContent);

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid quiz format');
    }

    questions.forEach((q, index) => {
      if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 ||
          typeof q.correctAnswer !== 'number' || !q.explanation) {
        throw new Error(`Quiz question ${index} has invalid structure`);
      }
      if (q.correctAnswer < 0 || q.correctAnswer > 3) {
        throw new Error(`Quiz question ${index} has invalid correctAnswer index`);
      }
    });

    return questions;
  } catch (parseError) {
    console.error('[Parse Error] Failed to parse AI response:', parseError.message || parseError);
    console.error('[Parse Error] Content that failed:', cleanContent.substring(0, 500));
    const errorMessage = (parseError && parseError.message) ? parseError.message : String(parseError);

    if (errorMessage.includes('Unterminated string') ||
        errorMessage.includes('Unexpected end of JSON input') ||
        errorMessage.includes('Unexpected token')) {
      console.log('[Parse Error] Attempting to repair malformed JSON...');

      try {
        let repairedContent = cleanContent;
        const lastCompleteObjectMatch = cleanContent.lastIndexOf('}');
        if (lastCompleteObjectMatch !== -1) {
          repairedContent = cleanContent.substring(0, lastCompleteObjectMatch + 1) + ']';
          console.log('[Parse Error] Attempting repair with:', repairedContent.substring(0, 200));
          const repairedQuestions = JSON.parse(repairedContent);
          if (Array.isArray(repairedQuestions) && repairedQuestions.length > 0) {
            console.log('[Parse Error] Successfully repaired JSON, recovered', repairedQuestions.length, 'questions');
            repairedQuestions.forEach((q, index) => {
              if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 ||
                  typeof q.correctAnswer !== 'number' || !q.explanation) {
                throw new Error(`Repaired quiz question ${index} has invalid structure`);
              }
              if (q.correctAnswer < 0 || q.correctAnswer > 3) {
                throw new Error(`Repaired quiz question ${index} has invalid correctAnswer index`);
              }
            });
            return repairedQuestions;
          }
        }
      } catch (repairError) {
        console.error('[Parse Error] Repair attempt failed:', repairError.message || repairError);
      }
    }

    // Additional repair strategy: try to extract the first JSON array occurrence within the content
    try {
      const arrayMatch = cleanContent.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        console.log('[Parse Repair] Found JSON array via regex, attempting parse...');
        const arr = JSON.parse(arrayMatch[0]);
        if (Array.isArray(arr) && arr.length > 0) {
          arr.forEach((q, index) => {
            if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 ||
                typeof q.correctAnswer !== 'number' || !q.explanation) {
              throw new Error(`Repaired quiz question ${index} has invalid structure`);
            }
          });
          console.log('[Parse Repair] Successfully parsed JSON array from content');
          return arr;
        }
      }
    } catch (arrayRepairError) {
      console.error('[Parse Repair] JSON array extraction failed:', arrayRepairError.message || arrayRepairError);
    }

    // Fallback: try to extract individual JSON objects and assemble an array
    try {
      const objMatches = [...cleanContent.matchAll(/\{[\s\S]*?\}/g)].map(m => m[0]);
      if (objMatches.length > 0) {
        const reconstructed = `[${objMatches.join(',')}]`;
        console.log('[Parse Repair] Attempting to reconstruct array from objects');
        const reconstructedArr = JSON.parse(reconstructed);
        if (Array.isArray(reconstructedArr) && reconstructedArr.length > 0) {
          reconstructedArr.forEach((q, index) => {
            if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 ||
                typeof q.correctAnswer !== 'number' || !q.explanation) {
              throw new Error(`Reconstructed quiz question ${index} has invalid structure`);
            }
          });
          console.log('[Parse Repair] Successfully reconstructed quiz questions:', reconstructedArr.length);
          return reconstructedArr;
        }
      }
    } catch (reconstructError) {
      console.error('[Parse Repair] Reconstruction attempt failed:', reconstructError.message || reconstructError);
    }

    throw new Error(`JSON parsing failed: ${errorMessage}`);
  }
}

// Sample test cases
const samples = [
  {
    name: 'valid',
    text: `[
  {"question":"What is 2+2?","options":["1","2","3","4"],"correctAnswer":3,"explanation":"2+2 equals 4"},
  {"question":"Capital of France?","options":["Berlin","London","Paris","Rome"],"correctAnswer":2,"explanation":"Paris is the capital of France"}
]`
  },
  {
    name: 'fenced',
    text: "```json\n[ {\"question\":\"Q?\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"correctAnswer\":0,\"explanation\":\"Because.\"} ]\n```"
  },
  {
    name: 'truncated',
    text: `[
  {"question":"Truncated Q","options":["A","B","C","D"],"correctAnswer":1,"explanation":"X"},
  {"question":"Incomplete",
`
  },
  {
    name: 'noisy',
    text: `Here is the quiz:\nSome intro text.\n[ {"question":"Noisy Q","options":["A","B","C","D"],"correctAnswer":2,"explanation":"Yes"} ]\nThanks!`
  }
];

for (const s of samples) {
  console.log('\n--- Running sample:', s.name, '---');
  try {
    const res = parseQuizQuestionsTest(s.text);
    console.log('Parsed result for', s.name, ':', JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('Failed to parse sample', s.name, '->', err.message || err);
  }
}
