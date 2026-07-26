/**
 * Utility function to sort lectures naturally by exercise/lesson number
 * e.g. 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2...
 */
export const sortLecturesNaturally = (a, b) => {
  if (!a || !b) return 0;

  const titleA = (a.title || '').trim();
  const titleB = (b.title || '').trim();

  // Extract pattern like "1.1", "1.2", "2.5", "10.12"
  const matchA = titleA.match(/(\d+)\.(\d+)/);
  const matchB = titleB.match(/(\d+)\.(\d+)/);

  if (matchA && matchB) {
    const majorA = parseInt(matchA[1], 10);
    const minorA = parseInt(matchA[2], 10);
    const majorB = parseInt(matchB[1], 10);
    const minorB = parseInt(matchB[2], 10);

    // 1st: Compare Unit/Major number (1 vs 2 vs 3...)
    if (majorA !== majorB) {
      return majorA - majorB;
    }
    // 2nd: Compare Exercise/Minor number (1.1 vs 1.2 vs 1.3...)
    if (minorA !== minorB) {
      return minorA - minorB;
    }
  } else if (matchA) {
    const singleB = titleB.match(/(\d+)/);
    if (singleB) {
      const numA = parseInt(matchA[1], 10);
      const numB = parseInt(singleB[1], 10);
      if (numA !== numB) return numA - numB;
    }
  } else if (matchB) {
    const singleA = titleA.match(/(\d+)/);
    if (singleA) {
      const numA = parseInt(singleA[1], 10);
      const numB = parseInt(matchB[1], 10);
      if (numA !== numB) return numA - numB;
    }
  }

  // Fallback to standard natural string comparison
  return titleA.localeCompare(titleB, undefined, { numeric: true, sensitivity: 'base' });
};
