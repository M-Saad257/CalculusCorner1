/**
 * Validates a single question object.
 * @param {Object} q - The question object { question, options, correctAnswer, explanation }
 * @param {number} index - 1-based index of the question for reporting
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
const validateQuestion = (q, index) => {
  const errors = [];

  if (!q.question || !q.question.trim()) {
    errors.push(`Row ${index}: Question text is missing or empty.`);
  }

  if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
    errors.push(`Row ${index}: Question must have at least 2 options.`);
  } else {
    // Check for duplicate options
    const uniqueOptions = new Set(q.options.map(opt => opt.trim()));
    if (uniqueOptions.size < q.options.length) {
      errors.push(`Row ${index}: Question has duplicate option values.`);
    }

    // Check correct answer bounds
    if (q.correctAnswer === null || q.correctAnswer === undefined || q.correctAnswer === '') {
      errors.push(`Row ${index}: Correct answer is missing.`);
    } else {
      const idx = parseInt(q.correctAnswer);
      if (isNaN(idx) || idx < 0 || idx >= q.options.length) {
        errors.push(`Row ${index}: Correct answer index ${q.correctAnswer} is out of bounds (options count: ${q.options.length}).`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates a batch of parsed questions.
 * @param {Array} questions - Array of question objects
 * @returns {Object} - { isValid: boolean, errors: string[], duplicateQuestions: string[] }
 */
const validateBatch = (questions) => {
  const errors = [];
  const questionTexts = new Map();
  const duplicateQuestions = [];

  questions.forEach((q, idx) => {
    const qIndex = idx + 1;
    const qVal = validateQuestion(q, qIndex);
    if (!qVal.isValid) {
      errors.push(...qVal.errors);
      
      // Inject review details into the question object itself
      q.needsReview = true;
      q.reviewReason = q.reviewReason || [];
      
      qVal.errors.forEach(err => {
        // Strip the "Row X:" prefix for user display
        const cleanMsg = err.replace(/^Row \d+:\s*/, '');
        if (!q.reviewReason.includes(cleanMsg)) {
          q.reviewReason.push(cleanMsg);
        }
      });
    }

    // Check duplicate questions in this batch
    if (q.question) {
      const normalizedQ = q.question.trim().toLowerCase();
      if (questionTexts.has(normalizedQ)) {
        duplicateQuestions.push(`Row ${qIndex} is a duplicate of Row ${questionTexts.get(normalizedQ)}: "${q.question.substring(0, 40)}..."`);
        
        q.needsReview = true;
        q.reviewReason = q.reviewReason || [];
        const dupMsg = `Duplicate question of Row ${questionTexts.get(normalizedQ)}`;
        if (!q.reviewReason.includes(dupMsg)) {
          q.reviewReason.push(dupMsg);
        }
      } else {
        questionTexts.set(normalizedQ, qIndex);
      }
    }
  });

  return {
    isValid: errors.length === 0 && duplicateQuestions.length === 0,
    errors,
    duplicateQuestions
  };
};

module.exports = {
  validateQuestion,
  validateBatch
};
