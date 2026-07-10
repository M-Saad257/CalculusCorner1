const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');

class BaseParserStrategy {
  async parse(buffer) {
    throw new Error('parse() must be implemented by strategy');
  }
}

// State-machine based text parsing (reused for PDF, DOCX, TXT)
function parseTextQuizLines(lines) {
  const parsedQuestions = [];
  let currentQuestion = null;
  let currentState = 'NONE'; // 'QUESTION' | 'OPTIONS' | 'ANSWER' | 'EXPLANATION'

  const questionRegex = /^\s*\[?(\d+)[\.\)\-\]]\s+(.+)$/;
  const optionRegex = /^\s*(?:[\(\[\\{]?([A-Da-d])[\)\]\\}]?[\.\-\)]|([A-Da-d])\s{2,})\s*(.*)$/;
  const answerRegex = /^\s*(?:Correct\s+)?Ans(?:wer)?\s*:\s*[\(\[\\{]?([A-Da-d])[\)\]\\}]?\b/i;
  const explanationRegex = /^\s*Explanation\s*:\s*(.*)$/i;
  const difficultyRegex = /^\s*Difficulty\s*:\s*(easy|medium|hard)\b/i;
  const subjectRegex = /^\s*Subject\s*:\s*(.+)$/i;
  const chapterRegex = /^\s*(?:Chapter|Topic)\s*:\s*(.+)$/i;

  for (let line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Ignore horizontal lines/separators
    if (/^[\-\=\_\*]{3,}$/.test(trimmedLine)) {
      continue;
    }

    // 1. Check if starts a new question
    const qMatch = line.match(questionRegex);
    if (qMatch) {
      if (currentQuestion) {
        parsedQuestions.push(currentQuestion);
      }
      currentQuestion = {
        id: `q_${Date.now()}_${parsedQuestions.length}`,
        question: qMatch[2].trim(),
        options: [],
        correctAnswer: null,
        explanation: '',
        difficulty: 'easy',
        subject: '',
        chapter: '',
        needsReview: false,
        reviewReason: []
      };
      currentState = 'QUESTION';
      continue;
    }

    // If no active question, skip lines until we find one
    if (!currentQuestion) continue;

    // 2. Check if it's an option prefix (A, B, C, D)
    const optMatch = line.match(optionRegex);
    if (optMatch) {
      const optLetter = (optMatch[1] || optMatch[2]).toUpperCase();
      const optText = optMatch[3].trim();
      currentQuestion.options.push(optText);
      currentState = 'OPTIONS';
      continue;
    }

    // 3. Check if it's the correct answer indicator
    const ansMatch = line.match(answerRegex);
    if (ansMatch) {
      const ansLetter = ansMatch[1].toUpperCase();
      const ansIndex = ansLetter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
      currentQuestion.correctAnswer = ansIndex;
      currentState = 'ANSWER';
      continue;
    }

    // 4. Check if it starts explanation
    const expMatch = line.match(explanationRegex);
    if (expMatch) {
      currentQuestion.explanation = expMatch[1].trim();
      currentState = 'EXPLANATION';
      continue;
    }

    // Check difficulty
    const diffMatch = line.match(difficultyRegex);
    if (diffMatch) {
      currentQuestion.difficulty = diffMatch[1].toLowerCase().trim();
      currentState = 'NONE';
      continue;
    }

    // Check subject
    const subMatch = line.match(subjectRegex);
    if (subMatch) {
      currentQuestion.subject = subMatch[1].trim();
      currentState = 'NONE';
      continue;
    }

    // Check chapter
    const chapMatch = line.match(chapterRegex);
    if (chapMatch) {
      currentQuestion.chapter = chapMatch[1].trim();
      currentState = 'NONE';
      continue;
    }

    // 5. Append text depending on state
    if (currentState === 'QUESTION') {
      currentQuestion.question += ' ' + trimmedLine;
    } else if (currentState === 'OPTIONS' && currentQuestion.options.length > 0) {
      currentQuestion.options[currentQuestion.options.length - 1] += ' ' + trimmedLine;
    } else if (currentState === 'EXPLANATION') {
      currentQuestion.explanation += ' ' + trimmedLine;
    }
  }

  // Push final question
  if (currentQuestion) {
    parsedQuestions.push(currentQuestion);
  }

  return parsedQuestions;
}

class PDFQuizParserStrategy extends BaseParserStrategy {
  async parse(buffer) {
    const data = await pdfParse(buffer);
    const lines = data.text.split('\n');
    return parseTextQuizLines(lines);
  }
}

class DocxQuizParserStrategy extends BaseParserStrategy {
  async parse(buffer) {
    const result = await mammoth.extractRawText({ buffer });
    const lines = result.value.split('\n');
    return parseTextQuizLines(lines);
  }
}

class TextQuizParserStrategy extends BaseParserStrategy {
  async parse(buffer) {
    const text = buffer.toString('utf8');
    const lines = text.split('\n');
    return parseTextQuizLines(lines);
  }
}

class XlsxQuizParserStrategy extends BaseParserStrategy {
  async parse(buffer) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet);
    const parsedQuestions = [];

    rows.forEach((row, idx) => {
      // Find question text
      const questionText = row.Question || row.question || row.text || row.QuestionText || '';
      if (!questionText.trim()) return;

      // Extract options (A, B, C, D)
      const options = [];
      
      const optA = row['Option A'] || row['option A'] || row['OptionA'] || row['A'] || row['a'];
      const optB = row['Option B'] || row['option B'] || row['OptionB'] || row['B'] || row['b'];
      const optC = row['Option C'] || row['option C'] || row['OptionC'] || row['C'] || row['c'];
      const optD = row['Option D'] || row['option D'] || row['OptionD'] || row['D'] || row['d'];

      if (optA !== undefined) options.push(String(optA).trim());
      if (optB !== undefined) options.push(String(optB).trim());
      if (optC !== undefined) options.push(String(optC).trim());
      if (optD !== undefined) options.push(String(optD).trim());

      // Correct Answer parsing (could be index or letter or text)
      let correctAnswer = null;
      const ansVal = row['Correct Answer'] || row['correct answer'] || row['Answer'] || row['answer'] || row['CorrectAnswer'];
      if (ansVal !== undefined) {
        const valStr = String(ansVal).trim().toUpperCase();
        if (['A', 'B', 'C', 'D'].includes(valStr)) {
          correctAnswer = valStr.charCodeAt(0) - 65;
        } else {
          const valNum = parseInt(valStr);
          if (!isNaN(valNum)) {
            // If it is 1-indexed (e.g. 1, 2, 3, 4), make it 0-indexed
            correctAnswer = valNum > 0 && valNum <= options.length ? valNum - 1 : valNum;
          } else {
            // Find option index by matching text
            const optIdx = options.findIndex(opt => opt.toLowerCase() === valStr.toLowerCase());
            if (optIdx !== -1) correctAnswer = optIdx;
          }
        }
      }

      parsedQuestions.push({
        id: `q_xlsx_${Date.now()}_${idx}`,
        question: questionText.trim(),
        options,
        correctAnswer,
        explanation: row.Explanation || row.explanation || '',
        difficulty: row.Difficulty || row.difficulty || 'easy',
        subject: row.Subject || row.subject || '',
        chapter: row.Chapter || row.chapter || row.Topic || row.topic || '',
        needsReview: false,
        reviewReason: []
      });
    });

    return parsedQuestions;
  }
}

class JsonQuizParserStrategy extends BaseParserStrategy {
  async parse(buffer) {
    const text = buffer.toString('utf8');
    const data = JSON.parse(text);
    const questions = Array.isArray(data) ? data : (data.questions || []);

    return questions.map((q, idx) => {
      // Standardize options structure
      let options = q.options || [];
      let correctAnswer = q.correctAnswer;

      // Map correct answer text to index if it's stored as text
      if (typeof correctAnswer === 'string' && options.includes(correctAnswer)) {
        correctAnswer = options.indexOf(correctAnswer);
      }

      return {
        id: q.id || `q_json_${Date.now()}_${idx}`,
        question: q.question || '',
        options: options.map(opt => String(opt).trim()),
        correctAnswer: correctAnswer !== undefined ? parseInt(correctAnswer) : null,
        explanation: q.explanation || '',
        difficulty: q.difficulty || 'easy',
        subject: q.subject || '',
        chapter: q.chapter || q.topic || '',
        needsReview: false,
        reviewReason: []
      };
    });
  }
}

class QuizParserContext {
  constructor(strategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  async parse(buffer) {
    if (!this.strategy) {
      throw new Error('No parsing strategy set');
    }
    return this.strategy.parse(buffer);
  }
}

module.exports = {
  QuizParserContext,
  PDFQuizParserStrategy,
  DocxQuizParserStrategy,
  TextQuizParserStrategy,
  XlsxQuizParserStrategy,
  JsonQuizParserStrategy
};
